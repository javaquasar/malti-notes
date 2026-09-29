# Learning content model

The site distinguishes four educational item types instead of inferring meaning from `maltese` and `english` alone:

- `translation`: Maltese text paired with its English translation.
- `example`: a bilingual sentence or phrase used as an example.
- `questionAnswer`: separate `question` and `answer` objects. Each object contains Maltese and may also contain English.
- `rule`: a grammar rule with an optional title and pattern.

Example banks use schema version 2. Every bank declares its site source, and every group declares a default `itemType`. Item-level metadata may override the group and may include `source`, `verificationStatus`, `verificationId`, `book`, `chapter`, and `page`.

```json
{
  "schemaVersion": 2,
  "source": { "kind": "site", "page": "daily_routine.html" },
  "groups": [
    {
      "id": "daily-routine-qa",
      "title": "Routine questions and short answers",
      "itemType": "questionAnswer",
      "items": [
        {
          "question": { "maltese": "Fejn taħdem?", "english": "Where do you work?" },
          "answer": { "maltese": "Naħdem f'uffiċċju.", "english": "I work in an office." }
        }
      ]
    }
  ]
}
```

Book provenance uses the same source object and must identify the book, chapter, and page rather than guessing from a filename:

```json
{
  "source": {
    "kind": "book",
    "book": "Maltese B1",
    "chapter": "Introductions",
    "page": 12
  }
}
```

`assets/js/learning-content.js` is the shared adapter for rendering, review cards, search, and generated revision content. `npm run content:model:check` rejects ambiguous Q&A pairs and missing type declarations. JSON Schema validation runs through `npm run schema:check`.
