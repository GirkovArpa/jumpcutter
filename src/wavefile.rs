pub struct Metadata {
    pub sample_rate: u32,
    pub sample_count: u32,
    pub max_volume: f64
}

pub fn get_sample_rate(filename: String) -> Metadata {
  let mut reader = hound::WavReader::open(filename).unwrap();
  let metadata = reader.spec();
  let max_volume = reader.samples::<i32>().fold(0.0, |max_volume, s| {
      let sample = f64::from(s.unwrap());
      if sample > max_volume {
        return sample;
      }
      max_volume
  });
  Metadata {
    sample_rate: metadata.sample_rate,
    sample_count: reader.len(),
    max_volume: max_volume
  }
}