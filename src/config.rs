use std::fs::File;
use std::io::prelude::*;
use rustc_serialize::json::{self};

static CONFIGFILE: &'static str = "cnf/report.json";

#[derive(RustcEncodable, RustcDecodable)]
pub struct Config {
        pub clients: Vec<String>
}

/*
impl Config {
	fn add(&mut self, client: String) {
		self.push(client);
	}
}
*/

#[allow(dead_code)]
pub fn write_config() {
        let clients = [String::from("baekkevold.net:8876")];
        let config = Config{ clients: clients.to_vec() };
        let data: String = json::encode(&config).unwrap();
        println!("use echo '[data]' > jq . to prettyfi");
        println!("{}", data);
}

pub fn read_config() -> Option<Config> {
        let mut file = match File::open(CONFIGFILE) {
                Ok(file) => file,
                Err(_) => panic!("no such file")
        };
        let mut json = String::new();
        match file.read_to_string(&mut json) {
                Ok(file) => file,
                Err(_) => panic!("could not read file to string")
        };
        return Some(json::decode(&json).unwrap());
}