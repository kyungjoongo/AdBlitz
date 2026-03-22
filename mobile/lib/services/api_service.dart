import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // === 서버 설정 플래그 ===
  static const bool useRemote = true;

  // Railway: https://<your-app>.up.railway.app/api (배포 후 실제 주소로 변경)
  // Firebase(구): https://api-vyspv6gwza-uc.a.run.app/api
  // 로컬: http://10.0.2.2:3000/api
  final String baseUrl = useRemote
    ? 'https://adblitz-backend-production.up.railway.app/api'
    : (Platform.isAndroid ? 'http://10.0.2.2:3000/api' : 'http://127.0.0.1:3000/api');

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token'); // 구현 편의상 로컬스토리지 토큰 사용
  }

  Future<Map<String, String>> getHeaders({bool includeContentType = true}) async {
    String? token = await getToken();
    return {
      if (includeContentType) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // 회원가입 API
  Future<bool> register(String email, String password, String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password, 'name': name}),
    );
    if (response.statusCode == 201) {
      final token = jsonDecode(response.body)['token'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', token);
      return true;
    }
    return false;
  }

  // 로그인 API
  Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      final token = jsonDecode(response.body)['token'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', token);
      return true;
    }
    return false;
  }
  
  // 로그아웃
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // 비디오 재생성
  Future<Map<String, dynamic>> regenerateVoice(String videoId, String engine, String gender, String style) async {
    final response = await http.post(
      Uri.parse('$baseUrl/videos/regenerate-voice/$videoId'),
      headers: await getHeaders(),
      body: jsonEncode({
        'voiceEngine': engine,
        'voiceGender': gender,
        'voiceStyle': style,
      }),
    );
    
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? '재생성 실패');
    }
  }

  // 얼굴 효과 필터 (밈 생성)
  Future<Map<String, dynamic>> generateFaceEffect(File imageFile, String gender) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/effects/two-face'));
    request.headers.addAll(await getHeaders(includeContentType: false));
    request.fields['gender'] = gender;
    request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));

    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    var jsonResponse = jsonDecode(responseData);
    
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonResponse;
    } else {
      throw Exception(jsonResponse['error'] ?? '얼굴 반전 생성 실패');
    }
  }

  // 새 광고 영상 직접 생성 (이미지 첨부)
  Future<Map<String, dynamic>> generateVideoDirect(File imageFile, Map<String, String> fields) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/videos/generate-direct'));
    request.headers.addAll(await getHeaders(includeContentType: false));
    request.fields.addAll(fields);
    request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));

    var response = await request.send().timeout(const Duration(minutes: 3));
    var responseData = await response.stream.bytesToString();
    var jsonResponse = jsonDecode(responseData);

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonResponse;
    } else {
      throw Exception(jsonResponse['error'] ?? '생성 실패');
    }
  }

  // 기본 생성 (웹과 동일한, productId 방식)
  Future<Map<String, dynamic>> generateVideo(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/videos/generate'),
      headers: await getHeaders(),
      body: jsonEncode(data),
    );
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? '생성 실패');
    }
  }

  // 목록 가져오기
  Future<List<dynamic>> fetchVideos() async {
    // 실제로는 GET /api/videos 가 필요합니다
    final response = await http.get(
      Uri.parse('$baseUrl/videos'),
      headers: await getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['videos'] ?? [];
    }
    return [];
  }

  // 비디오 상세 정보 가져오기
  Future<Map<String, dynamic>> fetchVideoDetail(String videoId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/videos/$videoId'),
      headers: await getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['video'];
    }
    throw Exception('상세 정보를 불러오지 못했습니다');
  }
}
