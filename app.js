const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'clmis_secure_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// SQLite Database Setup
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to in-memory SQLite database for CLMIS.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL,
        full_name TEXT,
        age INTEGER,
        gender TEXT,
        grade_section TEXT,
        device_ownership TEXT,
        device_used TEXT,
        internet_access TEXT,
        daily_usage TEXT,
        computer_experience TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        score INTEGER NOT NULL,
        domain_scores TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert Default Administrator Account
    const adminPassHash = bcrypt.hashSync('ICTvega_2627', 10);
    db.run(`INSERT OR IGNORE INTO users (user_id, password, role, full_name, email) 
            VALUES (?, ?, 'Administrator', 'System Administrator', 'admin@clmis.site')`,
        ['Admin_12-Vega', adminPassHash]
    );
});

// Authentication Middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) return next();
    res.status(401).json({ error: 'Unauthorized access. Please log in.' });
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === role) return next();
        res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    };
}

// --- API ROUTES ---

// Universal Login Route with Automatic Role Detection
app.post('/api/login', (req, res) => {
    const { userId, password } = req.body;
    db.get(`SELECT * FROM users WHERE user_id = ?`, [userId], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid User ID or Password.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid User ID or Password.' });

        req.session.user = {
            id: user.id,
            userId: user.user_id,
            role: user.role,
            fullName: user.full_name,
            gradeSection: user.grade_section
        };

        res.json({ success: true, role: user.role, redirect: `/${user.role.toLowerCase()}-dashboard` });
    });
});

// Student Registration Route
app.post('/api/register', async (req, res) => {
    const {
        userId, password, email, studentNumber, fullName, age, gender,
        gradeSection, deviceOwnership, deviceUsed, internetAccess,
        dailyUsage, computerExperience, agreed
    } = req.body;

    if (!agreed) return res.status(400).json({ error: 'You must agree to the Data Privacy Terms.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (user_id, password, email, role, full_name, age, gender, grade_section, device_ownership, device_used, internet_access, daily_usage, computer_experience)
                VALUES (?, ?, ?, 'Student', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, hashedPassword, email, fullName, age, gender, gradeSection, deviceOwnership, deviceUsed, internetAccess, dailyUsage, computerExperience],
            function(err) {
                if (err) return res.status(400).json({ error: 'User ID already exists or invalid data.' });
                res.json({ success: true, message: 'Registration successful!' });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Server registration error.' });
    }
});

// Admin Teacher Creation Route
app.post('/api/admin/teachers', isAuthenticated, requireRole('Administrator'), async (req, res) => {
    const { fullName, teacherId, email, userId, temporaryPassword, assignedSection, status } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        db.run(`INSERT INTO users (user_id, password, email, role, full_name, grade_section) VALUES (?, ?, ?, 'Teacher', ?, ?)`,
            [userId, hashedPassword, email, fullName, assignedSection],
            (err) => {
                if (err) return res.status(400).json({ error: 'Teacher User ID already exists.' });
                res.json({ success: true, message: 'Teacher account created successfully.' });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Server error creating teacher.' });
    }
});

// Get Student Dashboard Data
app.get('/api/student/dashboard', isAuthenticated, requireRole('Student'), (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.session.user.id], (err, user) => {
        db.all(`SELECT * FROM assessments WHERE user_id = ?`, [req.session.user.userId], (err, assessments) => {
            res.json({ profile: user, assessments });
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`CLMIS Official Server running on port ${PORT}`);
});