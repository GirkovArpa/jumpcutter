// comment out the line below to display rust debug info in the console
//#![windows_subsystem="windows"]
#[macro_use] extern crate sciter;
use sciter::Value;
mod wavefile;
struct EventHandler;
impl EventHandler {
    fn get_wav_metadata(&self, filename: String, callback: Value) -> bool {
        std::thread::spawn(move || {
            let metadata = wavefile::get_sample_rate(filename);
            let wavefile::Metadata { 
                sample_rate, 
                sample_count, 
                max_volume 
            } = metadata;
            let result = vmap! { 
                "sample_rate" => sample_rate as i32, 
                "sample_count" => sample_count as i32,
                "max_volume" => max_volume
            };
            callback.call(None, &make_args!(result), None).unwrap();
        });
        true
    }
}

impl sciter::EventHandler for EventHandler {
    fn get_subscription(&mut self) -> Option<sciter::dom::event::EVENT_GROUPS> {
		Some(sciter::dom::event::default_events() | sciter::dom::event::EVENT_GROUPS::HANDLE_METHOD_CALL)
    }
    dispatch_script_call! (
        fn get_wav_metadata(String, Value);
    );
}
fn main() {
    // set to true to enable connecting to Sciter's inspector.exe
    sciter::set_options(sciter::RuntimeOptions::DebugMode(true)).unwrap();
    let archived = include_bytes!("../target/app.rc");
    sciter::set_options(sciter::RuntimeOptions::ScriptFeatures(
        sciter::SCRIPT_RUNTIME_FEATURES::ALLOW_SYSINFO  as u8 |
        sciter::SCRIPT_RUNTIME_FEATURES::ALLOW_FILE_IO  as u8 |
        sciter::SCRIPT_RUNTIME_FEATURES::ALLOW_EVAL     as u8 |
        sciter::SCRIPT_RUNTIME_FEATURES::ALLOW_SYSINFO  as u8 
    )).unwrap();
    let mut frame = sciter::Window::new();
    frame.event_handler(EventHandler {});
    frame.archive_handler(archived).unwrap();
    frame.load_file("this://app/main.htm");
    frame.run_app();
}