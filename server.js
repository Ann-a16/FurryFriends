const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Конфигурация Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });



app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Подключение MongoDB
mongoose.connect('mongodb://localhost:27017/furryfriends', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});
// Схема объявления
const advertisementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  images: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, transform: (v) => v.toString()},
  createdAt: { type: Date, default: Date.now }
});

const Advertisement = mongoose.model('Advertisement', advertisementSchema);

// Схема пользователя
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);
// Схема откликов
const responseSchema = new mongoose.Schema({
  advertisement: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Advertisement', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Response = mongoose.model('Response', responseSchema);
// Маршруты

// Удаление объявления
app.delete('/advertisements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверка авторизации
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Валидация ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Неверный формат ID' });
    }

    // Поиск и удаление
    const result = await Advertisement.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      author: new mongoose.Types.ObjectId(req.session.userId)
    });

    if (!result) {
      return res.status(404).json({ 
        error: 'Объявление не найдено или нет прав доступа'
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Ошибка удаления:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение данных объявления для редактирования
app.get('/advertisements/:id', async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate('author', '_id name phone')
      .lean();
    
    if (!ad) return res.status(404).json({ error: 'Объявление не найдено' });
     // Преобразуем ObjectId в строки
     const processedAds = ads.map(ad => ({
      ...ad,
      _id: ad._id.toString(),
      author: {
        ...ad.author,
        _id: ad.author._id.toString()
      }
    }));
    
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление объявления
app.put('/advertisements/:id', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Объявление не найдено' });

    if (ad.author.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location
    };

    if (req.file) {
      updates.images = ['/uploads/' + req.file.filename];
    }

    const updatedAd = await Advertisement.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({ success: true, advertisement: updatedAd });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Маршрут для добавления объявлений
app.post('/advertisements', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { title, description, location } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : null;

    const newAd = new Advertisement({
      title,
      description,
      location,
      images: imagePath ? [imagePath] : [],
      author: req.session.userId
    });

    await newAd.save();
    res.json({ success: true, advertisement: newAd });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Добавьте обработчик для POST /responses
app.post('/responses', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { adId } = req.body;
    
    // Находим объявление с информацией об авторе
    const ad = await Advertisement.findById(adId)
      .populate('author', 'name phone')
      .lean();

    if (!ad) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    // Проверяем существующий отклик
    const existingResponse = await Response.findOne({
      advertisement: adId,
      user: req.session.userId
    });

    if (existingResponse) {
      return res.status(400).json({ error: 'Вы уже откликались на это объявление' });
    }

    // Создаем новый отклик
    const newResponse = new Response({
      advertisement: adId,
      user: req.session.userId
    });

    await newResponse.save();

    // Возвращаем данные автора объявления
    res.json({ 
      success: true,
      author: {
        name: ad.author.name,
        phone: ad.author.phone
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Маршрут для получения объявлений с поиском
app.get('/advertisements', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const searchRegex = new RegExp(searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

    const ads = await Advertisement.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ]
    })
    .populate('author', 'name phone')
    .sort({ createdAt: -1 });

    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/advertisements/:id/phone', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const ad = await Advertisement.findById(req.params.id).populate('author', 'phone');
    if (!ad) return res.status(404).json({ error: 'Объявление не найдено' });

    res.json({ phone: ad.author.phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { name, phone, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      phone,
      password: hashedPassword
    });

    await user.save();
    req.session.userId = user._id;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Вход
app.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Неверный телефон или пароль' });
        }

        req.session.userId = user._id;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Профиль пользователя
app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Не авторизован');
    }

    const user = await User.findById(req.session.userId);
    res.json(user);
});

// Выход
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});