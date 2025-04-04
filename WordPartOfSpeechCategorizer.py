import pandas as pd
import spacy

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

# Load your CSV file
df = pd.read_csv("tagalog_words_with_real_audio_links.csv")

# Function to detect part of speech
def get_part_of_speech(english_word):
    if pd.isna(english_word) or not isinstance(english_word, str):
        return "Unknown"
    doc = nlp(english_word)
    for token in doc:
        if token.pos_ not in ["PUNCT", "SPACE"]:
            return token.pos_
    return "Unknown"

# Apply to each row
df["Part of Speech"] = df["English Word"].apply(get_part_of_speech)

# Save the new file
df.to_csv("tagalog_words_with_pos.csv", index=False)

print("✅ Done! Saved as 'tagalog_words_with_pos.csv'")
