use wasm_bindgen::prelude::*;
use serde_json::Value;
use serde::Serialize;

// Helper to format JSON Value with specified spaces indentation
fn to_string_pretty_indent(value: &Value, indent_size: usize) -> Result<String, serde_json::Error> {
    let mut buf = Vec::new();
    let indent_bytes = vec![b' '; indent_size];
    let formatter = serde_json::ser::PrettyFormatter::with_indent(&indent_bytes);
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    value.serialize(&mut ser)?;
    Ok(String::from_utf8(buf).unwrap())
}

#[wasm_bindgen]
pub fn validate_json(json_str: &str) -> Result<String, String> {
    match serde_json::from_str::<Value>(json_str) {
        Ok(_) => Ok("Valid JSON".to_string()),
        Err(e) => Err(format!(
            "{} at line {}, column {}",
            e,
            e.line(),
            e.column()
        )),
    }
}

#[wasm_bindgen]
pub fn format_json(json_str: &str, indent_size: usize) -> Result<String, String> {
    let value: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("{} at line {}, column {}", e, e.line(), e.column()))?;
    
    to_string_pretty_indent(&value, indent_size)
        .map_err(|e| format!("Formatting error: {}", e))
}

#[wasm_bindgen]
pub fn minify_json(json_str: &str) -> Result<String, String> {
    let value: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("{} at line {}, column {}", e, e.line(), e.column()))?;
    
    serde_json::to_string(&value)
        .map_err(|e| format!("Minification error: {}", e))
}

#[wasm_bindgen]
pub fn sort_and_format_json(json_str: &str, indent_size: usize) -> Result<String, String> {
    // In serde_json, Map is backed by a BTreeMap (by default, when "preserve_order" is not enabled).
    // BTreeMap keeps its keys in sorted order.
    // Thus, deserializing a JSON string into `Value` automatically sorts all keys alphabetically
    // at all nesting levels.
    let value: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("{} at line {}, column {}", e, e.line(), e.column()))?;
    
    to_string_pretty_indent(&value, indent_size)
        .map_err(|e| format!("Formatting error: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sorting_keys() {
        let input = r#"{"z": 1, "a": 2, "nested": {"y": 3, "b": 4}}"#;
        let sorted = sort_and_format_json(input, 2).unwrap();
        
        // Assert that "a" comes before "nested" and "nested" before "z",
        // and inside "nested", "b" comes before "y".
        assert!(sorted.contains("\"a\": 2"));
        
        // Let's verify line order: "a" then "nested" then "z"
        let lines: Vec<&str> = sorted.lines().map(|l| l.trim()).collect();
        assert_eq!(lines[1], "\"a\": 2,");
        assert_eq!(lines[2], "\"nested\": {");
        assert_eq!(lines[3], "\"b\": 4,");
        assert_eq!(lines[4], "\"y\": 3");
        assert_eq!(lines[5], "},");
        assert_eq!(lines[6], "\"z\": 1");
    }

    #[test]
    fn test_invalid_json() {
        let input = r#"{"a": 1, "b": }"#;
        let res = validate_json(input);
        assert!(res.is_err());
        let err = res.unwrap_err();
        assert!(err.contains("line 1"));
        assert!(err.contains("column 15"));
    }
}
