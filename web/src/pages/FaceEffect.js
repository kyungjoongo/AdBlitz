import React, { useState } from 'react';
import { FiUploadCloud, FiImage, FiSettings } from 'react-icons/fi';
import api from '../api/client';
import './FaceEffect.css';

export default function FaceEffect() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [gender, setGender] = useState('male');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // 초기화
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      alert("이미지를 먼저 업로드해주세요.");
      return;
    }
    
    if (!window.confirm("1크레딧을 소모하여 '자신있는 얼굴 vs 쭈구리 얼굴' 밈을 생성하시겠습니까?")) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('gender', gender);

    try {
      const res = await api.post('/effects/two-face', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data.images);
      alert(res.data.message);
    } catch (error) {
      alert(error.response?.data?.error || '얼굴 변환 결과 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="face-effect-container">
      <div className="header-box">
        <h1>자신있는 vs 쭈구리 얼굴 필터 🎭</h1>
        <p>인스타그램, 스냅챗, 틱톡에서 유행하는 리액션 밈(Meme) 이미지를 AI로 단숨에 만들어보세요!</p>
      </div>

      <div className="effect-grid">
        <div className="upload-panel">
          <h3>1. 정면 얼굴 사진 업로드</h3>
          <div className="gender-selector" style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
            <label><input type="radio" value="male" checked={gender === 'male'} onChange={(e) => setGender(e.target.value)} /> 남성</label>
            <label><input type="radio" value="female" checked={gender === 'female'} onChange={(e) => setGender(e.target.value)} /> 여성</label>
          </div>
          <div className="upload-area">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <FiUploadCloud size={40} />
                <p>클릭하여 이미지를 선택하세요</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          
          <button 
            className="btn-primary generate-btn" 
            onClick={handleGenerate} 
            disabled={loading || !selectedFile}
          >
            {loading ? 'AI 변환 중... (약 20초 소요)' : '두 가지 얼굴 생성하기 (1 크레딧)'}
          </button>
        </div>

        <div className="result-panel">
          <h3>2. AI 반전 필터 결과</h3>
          {!result && !loading && (
             <div className="empty-result">
               <FiImage size={40} />
               <p>사진을 업로드하면 이곳에 결과가 나타납니다.</p>
             </div>
          )}
          
          {loading && (
             <div className="empty-result">
               <FiSettings className="spin-icon" size={40} />
               <p>AI가 얼굴을 분석하고 변형하고 있습니다...</p>
             </div>
          )}

          {result && (
            <div className="meme-result-grid">
              <div className="meme-box">
                <h4>자신감 뿜뿜 😎</h4>
                <p>Gigachad 스타일로 위풍당당해진 모습</p>
                <img src={result.confident} alt="Confident Face" />
                <a href={result.confident} download="confident_face" target="_blank" rel="noreferrer" className="btn-secondary">새 창에서 다운로드</a>
              </div>
              <div className="meme-box error-box">
                <h4>쭈구리/울상 😭</h4>
                <p>가엾고 불쌍한 Cowering 스타일</p>
                <img src={result.cowering} alt="Cowering Face" />
                <a href={result.cowering} download="cowering_face" target="_blank" rel="noreferrer" className="btn-secondary">새 창에서 다운로드</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
