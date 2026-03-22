import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../services/api_service.dart';

class VideoGenerateScreen extends StatefulWidget {
  @override
  _VideoGenerateScreenState createState() => _VideoGenerateScreenState();
}

class _VideoGenerateScreenState extends State<VideoGenerateScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();
  
  // STT 관련
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;

  String selectedPlatform = 'reels';
  int duration = 15;
  String selectedTemplate = 'hook-problem-solution';
  String selectedEngine = 'fal_premium';
  String selectedGender = 'female';
  String selectedStyle = 'female_pro';
  int selectedCopy = 0;
  
  bool isGenerating = false;
  String? selectedPreset;

  final List<Map<String, dynamic>> _presets = [
    {
      'id': 'skincare',
      'icon': Icons.face_retouching_natural,
      'label': '스킨케어 / 화장품',
      'name': '프리미엄 스킨케어',
      'description': '피부 깊숙이 수분 공급, 24시간 촉촉한 피부 유지. 자연 유래 성분으로 민감한 피부도 안심 사용.',
      'platform': 'reels',
      'duration': 15,
      'engine': 'fal_premium',
      'gender': 'female',
      'style': 'female_pro',
    },
    {
      'id': 'food',
      'icon': Icons.restaurant,
      'label': '식품 / 건강식품',
      'name': '건강 기능 식품',
      'description': '하루 한 포로 간편하게 건강 관리. 100% 국내산 원료, 식약처 인증 기능성 원료 함유.',
      'platform': 'shorts',
      'duration': 15,
      'engine': 'minimax',
      'gender': 'female',
      'style': 'energetic_girl',
    },
    {
      'id': 'fashion',
      'icon': Icons.checkroom,
      'label': '패션 / 의류',
      'name': '트렌디 패션 아이템',
      'description': '이번 시즌 핫한 스타일링 아이템. 편안한 착용감과 세련된 디자인을 동시에.',
      'platform': 'tiktok',
      'duration': 15,
      'engine': 'minimax',
      'gender': 'female',
      'style': 'energetic_girl',
    },
    {
      'id': 'tech',
      'icon': Icons.devices,
      'label': '전자기기 / IT',
      'name': '스마트 디바이스',
      'description': '최신 기술 탑재, 일상을 바꾸는 스마트 디바이스. 초고속 성능과 혁신적 디자인.',
      'platform': 'shorts',
      'duration': 30,
      'engine': 'fal_premium',
      'gender': 'male',
      'style': 'male_pro',
    },
    {
      'id': 'fitness',
      'icon': Icons.fitness_center,
      'label': '피트니스 / 다이어트',
      'name': '홈트레이닝 프로그램',
      'description': '집에서 하루 20분, 전문 트레이너 프로그램. 눈에 보이는 변화를 4주 안에 경험하세요.',
      'platform': 'reels',
      'duration': 15,
      'engine': 'minimax',
      'gender': 'male',
      'style': 'excited_boy',
    },
    {
      'id': 'edu',
      'icon': Icons.school,
      'label': '교육 / 온라인강의',
      'name': '온라인 클래스',
      'description': '현직 전문가가 알려주는 실무 노하우. 누적 수강생 10만 명 돌파, 만족도 98%.',
      'platform': 'shorts',
      'duration': 30,
      'engine': 'fal_premium',
      'gender': 'male',
      'style': 'male_pro',
    },
  ];

  void _applyPreset(Map<String, dynamic> preset) {
    setState(() {
      selectedPreset = preset['id'];
      _nameController.text = preset['name'];
      _descriptionController.text = preset['description'];
      selectedPlatform = preset['platform'];
      duration = preset['duration'];
      selectedEngine = preset['engine'];
      selectedGender = preset['gender'];
      selectedStyle = preset['style'];
    });
  }

  void _listen() async {
    if (!_isListening) {
      bool available = await _speech.initialize(
        onStatus: (val) => print('onStatus: $val'),
        onError: (val) => print('onError: $val'),
      );
      if (available) {
        setState(() => _isListening = true);
        _speech.listen(
          onResult: (val) => setState(() {
            _descriptionController.text = val.recognizedWords;
          }),
        );
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
  }

  void _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _selectedImage = File(image.path));
    }
  }

  void _submit() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('상품 사진을 먼저 등록해주세요!')));
      return;
    }
    if (_nameController.text.isEmpty || _descriptionController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('상품 명칭과 특징을 입력해주세요!')));
      return;
    }

    setState(() => isGenerating = true);
    try {
      await ApiService().generateVideoDirect(_selectedImage!, {
        'productName': _nameController.text,
        'description': _descriptionController.text,
        'duration': duration.toString(),
        'platform': selectedPlatform,
        'template': selectedTemplate,
        'voiceEngine': selectedEngine,
        'voiceGender': selectedGender,
        'voiceStyle': selectedStyle,
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('생성이 시작되었습니다. 2분 뒤 대시보드에서 완료됩니다.')));
      Navigator.pop(context);
    } catch(e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('에러: $e')));
    } finally {
      setState(() => isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('새 광고 영상 생성')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('광고 프리셋 선택', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.deepPurple)),
            SizedBox(height: 8),
            Text('카테고리를 선택하면 자동으로 설정이 채워집니다.', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
            SizedBox(height: 12),
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _presets.length,
                separatorBuilder: (_, __) => SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final preset = _presets[index];
                  final isSelected = selectedPreset == preset['id'];
                  return GestureDetector(
                    onTap: () => _applyPreset(preset),
                    child: Container(
                      width: 90,
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.deepPurple.shade50 : Colors.white,
                        border: Border.all(
                          color: isSelected ? Colors.deepPurple : Colors.grey.shade300,
                          width: isSelected ? 2 : 1,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(preset['icon'], size: 32, color: isSelected ? Colors.deepPurple : Colors.grey.shade600),
                          SizedBox(height: 6),
                          Text(
                            preset['label'],
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? Colors.deepPurple : Colors.grey.shade700),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            SizedBox(height: 25),

            Text('1. 상품 정보 입력', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.deepPurple)),
            SizedBox(height: 15),
            
            // 이미지 선택
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 150,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: Colors.grey.shade300, width: 2),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: _selectedImage != null 
                  ? ClipRRect(borderRadius: BorderRadius.circular(13), child: Image.file(_selectedImage!, fit: BoxFit.cover))
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo, size: 40, color: Colors.grey),
                        Text('광고에 사용할 이미지 등록', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
              ),
            ),
            SizedBox(height: 15),

            // 상품명
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: '상품 명칭',
                hintText: '예: 비스포크 냉장고, 고기능성 썬크림 등',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: Icon(Icons.shopping_bag),
              ),
            ),
            SizedBox(height: 15),

            // 특징
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: '상품 주요 특징 및 설명',
                hintText: '예: 세계 최초 3단 냉각 시스템, 가볍게 발리는 텍스처 등',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: Icon(Icons.description),
                suffixIcon: IconButton(
                  icon: Icon(_isListening ? Icons.mic : Icons.mic_none),
                  color: _isListening ? Colors.red : Colors.deepPurple,
                  onPressed: _listen,
                  tooltip: '음성으로 입력하기',
                ),
              ),
            ),
            SizedBox(height: 25),

            Text('2. 영상 및 AI 음성 설정', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.deepPurple)),
            SizedBox(height: 15),

             // 플랫폼
            DropdownButtonFormField<String>(
              value: selectedPlatform,
              decoration: InputDecoration(
                labelText: '송출 플랫폼',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: Icon(Icons.phonelink_setup),
              ),
              items: [
                DropdownMenuItem(value: 'tiktok', child: Text('TikTok (9:16)')),
                DropdownMenuItem(value: 'reels', child: Text('Instagram Reels (9:16)')),
                DropdownMenuItem(value: 'shorts', child: Text('YouTube Shorts (9:16)')),
              ],
              onChanged: (v) => setState(() => selectedPlatform = v!),
            ),
            SizedBox(height: 15),

            // 길이
            DropdownButtonFormField<int>(
              value: duration,
              decoration: InputDecoration(
                labelText: '영상 길이',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: Icon(Icons.timer),
              ),
              items: [
                DropdownMenuItem(value: 15, child: Text('15초 (1 크레딧 소모)')),
                DropdownMenuItem(value: 30, child: Text('30초 (2 크레딧 소모)')),
              ],
              onChanged: (v) => setState(() => duration = v!),
            ),
            SizedBox(height: 15),

            // AI 엔진
            DropdownButtonFormField<String>(
              value: selectedEngine,
              decoration: InputDecoration(
                labelText: 'AI 음성 엔진',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: Icon(Icons.interpreter_mode),
              ),
              items: [
                DropdownMenuItem(value: 'minimax', child: Text('MiniMax (숏폼 전문 - 빠름)')),
                DropdownMenuItem(value: 'tiktok', child: Text('TikTok (오리지널 기계음)')),
                DropdownMenuItem(value: 'fal_premium', child: Text('Premium (fal 초고음질 성우)')),
              ],
              onChanged: (val) {
                setState(() {
                  selectedEngine = val!;
                  if (val == 'tiktok') selectedStyle = 'kr_002';
                  else if (val == 'fal_premium') selectedStyle = 'female_pro';
                  else selectedStyle = 'energetic_girl';
                });
              },
            ),
            SizedBox(height: 15),

            // 성별
            DropdownButtonFormField<String>(
              value: selectedGender,
              decoration: InputDecoration(
                labelText: '성별 선택',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: Icon(Icons.people),
              ),
              items: [
                DropdownMenuItem(value: 'female', child: Text('여성')),
                DropdownMenuItem(value: 'male', child: Text('남성')),
              ],
              onChanged: (v) => setState(() => selectedGender = v!),
            ),
            SizedBox(height: 15),

             // 스타일
            DropdownButtonFormField<String>(
              isExpanded: true,
              value: selectedStyle,
              decoration: InputDecoration(
                labelText: '보이스 디테일 스타일',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: Icon(Icons.style),
              ),
              items: selectedEngine == 'minimax' 
                  ? [
                      DropdownMenuItem(value: 'energetic_girl', child: Text('에너지 넘치는 소녀')),
                      DropdownMenuItem(value: 'excited_boy', child: Text('흥분한 소년')),
                      DropdownMenuItem(value: 'storyteller', child: Text('이야기꾼 (ASMR)')),
                      DropdownMenuItem(value: 'booming', child: Text('웅장한 목소리 (임팩트)')),
                    ] 
                  : selectedEngine == 'tiktok'
                  ? [
                      DropdownMenuItem(value: 'kr_002', child: Text('상쾌한 아가씨 (kr_002)')),
                      DropdownMenuItem(value: 'kr_003', child: Text('에너지 남성 (kr_003)')),
                      DropdownMenuItem(value: 'kr_004', child: Text('상큼한 소녀 (kr_004)')),
                    ]
                  : [
                      DropdownMenuItem(value: 'female_pro', child: Text('프리미엄 여성 성우')),
                      DropdownMenuItem(value: 'male_pro', child: Text('프리미엄 남성 성우')),
                    ],
              onChanged: (v) => setState(() => selectedStyle = v!),
            ),
            SizedBox(height: 40),
            
            ElevatedButton.icon(
              icon: isGenerating ? SizedBox(width: 15, height: 15, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Icon(Icons.video_call),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 60),
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                elevation: 5,
              ),
              onPressed: isGenerating ? null : _submit,
              label: Text(isGenerating ? 'AI가 영상 및 오디오 렌더링 중...' : '광고 영상 생성하기', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            SizedBox(height: 30),
          ]
        )
      )
    );
  }
}
