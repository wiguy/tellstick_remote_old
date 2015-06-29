use rustc_serialize::json::{self};
use std::str;
use telldus;

#[derive(RustcEncodable, RustcDecodable)]
pub struct SwitchData {
	pub id: i32,
	pub state: telldus::types::State
}

#[derive(RustcEncodable, RustcDecodable)]
pub enum Action {
	Register,
	Switch(SwitchData)
}

#[derive(RustcEncodable, RustcDecodable)]
pub struct Message {
	pub password: String,
	pub action: Action,
}

impl Message {
	pub fn from_string(s: String) -> Result<Message, json::DecoderError> {
		return json::decode(str::from_utf8(s.as_bytes()).unwrap());
	}
}

#[allow(dead_code)]
pub fn write_message() {
	let m = Message {
			password: String::from("pwd"),
			action: Action::Switch(SwitchData { id: 1, state: telldus::types::State::On }),
	};
	let data: String = json::encode(&m).unwrap();
        println!("use echo '[data]' > jq . to prettyfi. Remember to quites!");
	println!("{}", data);
}
