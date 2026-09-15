const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Supabase 접속 설정
const SUPABASE_URL = 'https://hjnnhotbvajwlmjxqaok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7EC8DUQZ2bRvh4qRkJHgKg_r2XfWgL4'; // 본인 키 입력

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 기본 테스트 API
app.get('/', (req, res) => {
  res.send('E-UM 백엔드 서버가 정상 작동 중입니다!');
});

// 프론트엔드 통신 테스트용 API
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '🎉 프론트엔드와 백엔드가 성공적으로 연결되었습니다!',
  });
});

// 1. 상품 목록 조회 (GET) - Supabase DB에서 가져오기
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase 조회 에러:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, products: data });
  } catch (error) {
    console.error('❌ 서버 내부 에러:', error.message);
    res.status(500).json({ success: false, message: '서버 에러 발생' });
  }
});

// 2. 상품 등록 (POST) - Supabase DB에 저장하기
app.post('/api/products', async (req, res) => {
  const { title, price, description, location } = req.body;

  if (!title || !price) {
    return res.status(400).json({ success: false, message: '제목과 가격을 입력해 주세요.' });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          title,
          price,
          description,
          location: location || '캠퍼스 내',
          time: '방금 전',
        },
      ])
      .select();

    if (error) throw error;

    res.json({ success: true, product: data[0] });
  } catch (error) {
    console.error('DB 저장 에러:', error.message);
    res.status(500).json({ success: false, message: '상품 등록에 실패했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Supabase DB 연동 완료! 서버 실행 중: http://localhost:${PORT}`);
});