use wasm_bindgen::prelude::*;

fn normalize_char(ch: char) -> char {
    match ch {
        'À' | 'Á' | 'Â' | 'Ã' | 'Ä' | 'Å' | 'à' | 'á' | 'â' | 'ã' | 'ä' | 'å' => 'a',
        'È' | 'É' | 'Ê' | 'Ë' | 'è' | 'é' | 'ê' | 'ë' => 'e',
        'Ì' | 'Í' | 'Î' | 'Ï' | 'ì' | 'í' | 'î' | 'ï' => 'i',
        'Ò' | 'Ó' | 'Ô' | 'Õ' | 'Ö' | 'ò' | 'ó' | 'ô' | 'õ' | 'ö' => 'o',
        'Ù' | 'Ú' | 'Û' | 'Ü' | 'ù' | 'ú' | 'û' | 'ü' => 'u',
        'Ċ' | 'ċ' => 'c',
        'Ġ' | 'ġ' => 'g',
        'Ħ' | 'ħ' => 'h',
        'Ż' | 'ż' => 'z',
        '’' | '‘' | '`' => '\'',
        _ => ch.to_ascii_lowercase(),
    }
}

#[wasm_bindgen]
pub fn normalize_query(input: &str) -> String {
    let normalized = input
        .chars()
        .map(normalize_char)
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    normalized.trim().to_string()
}

#[wasm_bindgen]
pub fn score_candidate(query: &str, candidate: &str) -> u32 {
    let query = normalize_query(query);
    let candidate = normalize_query(candidate);

    if query.is_empty() || candidate.is_empty() {
        return 0;
    }

    if query == candidate {
        100
    } else if candidate.starts_with(&query) {
        75
    } else if candidate.contains(&query) {
        50
    } else {
        0
    }
}

#[wasm_bindgen]
pub fn match_summary(query: &str, candidate: &str) -> String {
    let score = score_candidate(query, candidate);
    match score {
        100 => "exact match".to_string(),
        75 => "prefix match".to_string(),
        50 => "contains match".to_string(),
        _ => "no match".to_string(),
    }
}
