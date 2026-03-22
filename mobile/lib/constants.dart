class AppConstants {
  // API 서버 설정
  static const bool useRemote = true;
  static const String remoteBaseUrl = 'https://api-vyspv6gwza-uc.a.run.app/api';
  static const String localBaseUrlAndroid = 'http://10.0.2.2:3000/api';
  static const String localBaseUrlIOS = 'http://127.0.0.1:3000/api';

  // 외부 API 키 (서버 사이드에서만 사용, 클라이언트에는 노출하지 않음)
  // static const String falApiToken = '...';
  // static const String openAiApiKey = '...';

  // 앱 설정
  static const String appName = 'AdBlitz';
  static const int defaultVideoDuration = 15;
  static const List<String> supportedPlatforms = ['tiktok', 'reels', 'shorts', 'feed'];
}
