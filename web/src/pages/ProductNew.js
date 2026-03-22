import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/client';
import './ProductNew.css';

export default function ProductNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    targetGender: 'all',
    targetAgeMin: '20',
    targetAgeMax: '40',
    targetDescription: '',
  });
  const [features, setFeatures] = useState(['']);

  const onDrop = useCallback((files) => {
    const newImages = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
  });

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addFeature = () => {
    if (features.length < 5) setFeatures([...features, '']);
  };

  const updateFeature = (idx, value) => {
    const updated = [...features];
    updated[idx] = value;
    setFeatures(updated);
  };

  const removeFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('상품명과 가격은 필수입니다');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      images.forEach((img) => formData.append('images', img.file));
      formData.append('name', form.name);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('targetGender', form.targetGender);
      formData.append('targetAgeMin', form.targetAgeMin);
      formData.append('targetAgeMax', form.targetAgeMax);
      formData.append('targetDescription', form.targetDescription);
      formData.append('features', JSON.stringify(features.filter((f) => f.trim())));

      const res = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('상품이 등록되었습니다!');
      navigate(`/videos/generate/${res.data.product._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || '등록 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-new">
      <h1>새 광고 만들기</h1>
      <p className="page-sub">상품 정보를 입력하면 AI가 광고 영상을 만들어드립니다</p>

      <form onSubmit={handleSubmit}>
        {/* 이미지 업로드 */}
        <div className="form-section">
          <h2>상품 이미지</h2>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <FiUpload size={32} />
            <p>이미지를 드래그하거나 클릭하여 업로드</p>
            <span>JPG, PNG, WebP / 최대 5장 / 10MB 이하</span>
          </div>
          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((img, i) => (
                <div key={i} className="image-preview">
                  <img src={img.preview} alt={`preview-${i}`} />
                  <button type="button" onClick={() => removeImage(i)} className="remove-img"><FiX /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="form-section">
          <h2>상품 정보</h2>
          <div className="form-row">
            <div className="form-group">
              <label>상품명 *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="예: 초경량 블루투스 이어폰" required />
            </div>
            <div className="form-group">
              <label>가격 (원) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="29900" required />
            </div>
          </div>
          <div className="form-group">
            <label>카테고리</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">선택</option>
              <option value="패션">패션</option>
              <option value="뷰티">뷰티</option>
              <option value="전자기기">전자기기</option>
              <option value="식품">식품</option>
              <option value="생활용품">생활용품</option>
              <option value="건강">건강</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>

        {/* 특징 */}
        <div className="form-section">
          <h2>상품 특징 (최대 5개)</h2>
          {features.map((f, i) => (
            <div key={i} className="feature-input-row">
              <input
                value={f}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder={`특징 ${i + 1}: 예) 무선 충전 지원`}
              />
              {features.length > 1 && (
                <button type="button" onClick={() => removeFeature(i)} className="btn-icon"><FiX /></button>
              )}
            </div>
          ))}
          {features.length < 5 && (
            <button type="button" onClick={addFeature} className="btn-add-feature">
              <FiPlus /> 특징 추가
            </button>
          )}
        </div>

        {/* 타겟 */}
        <div className="form-section">
          <h2>타겟 고객</h2>
          <div className="form-row three">
            <div className="form-group">
              <label>성별</label>
              <select name="targetGender" value={form.targetGender} onChange={handleChange}>
                <option value="all">전체</option>
                <option value="female">여성</option>
                <option value="male">남성</option>
              </select>
            </div>
            <div className="form-group">
              <label>최소 연령</label>
              <input name="targetAgeMin" type="number" value={form.targetAgeMin} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>최대 연령</label>
              <input name="targetAgeMax" type="number" value={form.targetAgeMax} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>타겟 설명 (선택)</label>
            <textarea
              name="targetDescription"
              value={form.targetDescription}
              onChange={handleChange}
              placeholder="예: 운동을 좋아하는 20대 직장인"
              rows={2}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? '등록 중...' : '다음: 광고 영상 생성하기'}
        </button>
      </form>
    </div>
  );
}
