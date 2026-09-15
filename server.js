const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Supabase 접속 설정 (환경 변수 사용)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; // 설정한 이름에 맞게 선택

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

// 3. 회원가입 API (POST)
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해 주세요.' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ 회원가입 에러:', error.message);
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: '회원가입 성공! (이메일 인증이 켜져있다면 인증을 확인해주세요)', data });
  } catch (error) {
    console.error('❌ 서버 내부 에러:', error.message);
    res.status(500).json({ success: false, message: '회원가입 처리 중 서버 에러 발생' });
  }
});

// 4. 로그인 API (POST)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해 주세요.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ 로그인 에러:', error.message);
      return res.status(400).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    res.json({ 
      success: true, 
      message: '로그인 성공!', 
      session: data.session, // 사용자 토큰 정보 등
      user: data.user 
    });
  } catch (error) {
    console.error('❌ 서버 내부 에러:', error.message);
    res.status(500).json({ success: false, message: '로그인 처리 중 서버 에러 발생' });
  }
});

// 5. 상품 삭제 API (DELETE) - Supabase DB에서 삭제하기
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase 삭제 에러:', error.message);
      return res.status(400).json({ success: false, message: error.message });
    }

    // 만약 해당 id의 상품이 없어서 삭제된 데이터가 없는 경우
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: '삭제할 매물을 찾을 수 없습니다.' });
    }

    console.log(`🗑️ 상품 ID ${id} 삭제 완료`);
    res.json({ success: true, message: '매물이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('❌ 서버 내부 에러:', error.message);
    res.status(500).json({ success: false, message: '상품 삭제 중 서버 에러 발생' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Supabase DB 연동 완료! 서버 실행 중: http://localhost:${PORT}`);
});