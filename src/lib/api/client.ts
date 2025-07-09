import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAuth } from 'firebase/auth';

// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.inschoolz.com';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 설정
apiClient.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const token = await user.getIdToken();
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // 에러 처리 로직
    if (error.response) {
      // 서버 응답이 있는 에러 (4xx, 5xx 상태 코드)
      console.error('API 오류:', error.response.data);
      
      // 401 Unauthorized 에러 처리
      if (error.response.status === 401) {
        // 로그인 페이지로 리다이렉트 또는 토큰 갱신 로직
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // 서버로 요청이 전송되었으나 응답이 없는 경우
      console.error('응답 없음:', error.request);
    } else {
      // 요청 설정 중 에러 발생
      console.error('요청 오류:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 