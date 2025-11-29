const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://ruya.vklabs.site', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://ruya.vklabs.site",
    "X-Title": "Rüya Tabircisi"
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Rüya Tabircisi API is running' });
});

app.post('/api/interpret-dream', async (req, res) => {
  try {
    const { dream } = req.body;
    
    if (!dream || dream.trim().length === 0) {
      return res.status(400).json({ error: 'Rüya metni gereklidir' });
    }

    const completion = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [{
        role: "user",
        content: `Sen İslami rüya tabiri konusunda uzman bir yapay zeka asistanısın. İbn-i Sirin, Nablusi ve diğer klasik İslami rüya tabiri kaynaklarına hakimsin.

Şu rüyayı analiz et ve İslami geleneklere dayalı bir yorum yap:

"${dream}"

Lütfen yanıtını aşağıdaki JSON formatında ver:
{
  "anaSimgeler": ["simge1", "simge2", "simge3"],
  "yorum": "İslami kaynaklara dayalı detaylı yorum (en az 100 kelime)",
  "maneviBilgelik": "manevi tavsiye veya düşünce",
  "gorselTanim": "rüyanın temasını temsil eden bir sanatsal görsel için kısa açıklama"
}

SADECE JSON nesnesini döndür, markdown formatlaması veya ek metin ekleme.`
      }]
    });

    const responseText = completion.choices[0].message.content;
    const cleanText = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    res.json({
      content: [{
        type: "text",
        text: JSON.stringify(parsed)
      }]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Rüya yorumlanırken bir hata oluştu',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
