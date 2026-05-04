const express = require('express');
const compression = require('compression');
const path = require('path');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// 🚀 1. Aktifkan Gzip Compression (Penting buat data JSON yang besar)
app.use(compression());

// 📝 2. Logging untuk memantau request
app.use(morgan('dev'));

// 📁 3. Serve Static Files dengan optimasi
app.use(express.static(__dirname, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        // Jangan cache file JSON saat development agar data selalu fresh
        if (filePath.endsWith('.json')) {
            res.setHeader('Cache-Control', 'public, max-age=0');
        }
    }
}));

// 📍 4. Routing fallback (Opsional: berguna untuk clean URLs)
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    if (page.includes('.')) return next(); // Abaikan jika ada ekstensi file
    
    // Coba kirim folder/index.html jika ada
    res.sendFile(path.join(__dirname, page, 'index.html'), (err) => {
        if (err) {
            // Jika tidak ada folder, coba kirim file .html langsung (Redirect Shells)
            res.sendFile(path.join(__dirname, `${page}.html`), (err2) => {
                if (err2) next();
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`
┌──────────────────────────────────────────────────┐
│                                                  │
│   🚀 SERVER DATA TERMINAL ONLINE                │
│                                                  │
│   📡 URL         : http://localhost:${PORT}          │
│   📂 DIRECTORY   : ${__dirname}   │
│   ⚡ COMPRESSION : ENABLED (Gzip)                │
│                                                  │
└──────────────────────────────────────────────────┘
    `);
});
