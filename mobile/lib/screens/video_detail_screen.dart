import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:video_player/video_player.dart';

class VideoDetailScreen extends StatefulWidget {
  final Map<String, dynamic> video;
  
  VideoDetailScreen({required this.video});

  @override
  _VideoDetailScreenState createState() => _VideoDetailScreenState();
}

class _VideoDetailScreenState extends State<VideoDetailScreen> {
  late Map<String, dynamic> _currentVideo;
  VideoPlayerController? _controller;
  bool _isPlaying = false;
  Timer? _statusTimer;

  @override
  void initState() {
    super.initState();
    _currentVideo = widget.video;
    
    if (_currentVideo['status'] == 'completed') {
      _initVideoPlayer();
    } else if (_currentVideo['status'] == 'processing') {
      _startPolling();
    }
  }

  void _startPolling() {
    _statusTimer = Timer.periodic(Duration(seconds: 3), (timer) async {
      try {
        final updated = await ApiService().fetchVideoDetail(_currentVideo['_id'] ?? _currentVideo['id']);
        setState(() {
          _currentVideo = updated;
        });
        
        if (updated['status'] == 'completed') {
          _statusTimer?.cancel();
          _initVideoPlayer();
        } else if (updated['status'] == 'failed') {
          _statusTimer?.cancel();
        }
      } catch (e) {
        print('Polling error: $e');
      }
    });
  }

  void _initVideoPlayer() {
    if (_currentVideo['output'] == null || _currentVideo['output']['videoUrl'] == null) return;
    
    String videoUrl = _currentVideo['output']['videoUrl'];
    if (videoUrl.startsWith('/')) {
        videoUrl = ApiService().baseUrl.replaceAll('/api', '') + videoUrl;
    }

    _controller = VideoPlayerController.networkUrl(Uri.parse(videoUrl))
      ..initialize().then((_) {
        setState(() {});
      });
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    _controller?.dispose();
    super.dispose();
  }

  void _showRegenerateDialog() async {
    String selectedEngine = 'minimax';
    String selectedGender = 'female';
    String selectedStyle = 'energetic_girl';
    bool isRegenerating = false;

    await showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: Text('음성 자동 스왑 (1 크레딧)'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: selectedEngine,
                    items: [
                      DropdownMenuItem(value: 'minimax', child: Text('MiniMax (숏폼 특화)')),
                      DropdownMenuItem(value: 'tiktok', child: Text('TikTok (캡컷 기계음)')),
                      DropdownMenuItem(value: 'fal_premium', child: Text('Premium (fal 성우)')),
                    ],
                    onChanged: (val) {
                      setModalState(() {
                        selectedEngine = val!;
                        if (val == 'tiktok') selectedStyle = 'kr_002';
                        else if (val == 'fal_premium') selectedStyle = 'female_pro';
                        else selectedStyle = 'energetic_girl';
                      });
                    },
                    decoration: InputDecoration(labelText: 'AI 음성 엔진'),
                  ),
                  SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: selectedGender,
                    items: [
                      DropdownMenuItem(value: 'female', child: Text('여성')),
                      DropdownMenuItem(value: 'male', child: Text('남성')),
                    ],
                    onChanged: (val) => setModalState(() => selectedGender = val!),
                    decoration: InputDecoration(labelText: '성별'),
                  ),
                  SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    isExpanded: true,
                    value: selectedStyle,
                    items: selectedEngine == 'minimax' 
                      ? [
                          DropdownMenuItem(value: 'energetic_girl', child: Text('에너지 넘치는 소녀')),
                          DropdownMenuItem(value: 'excited_boy', child: Text('흥분한 소년')),
                          DropdownMenuItem(value: 'storyteller', child: Text('이야기꾼 (ASMR)')),
                          DropdownMenuItem(value: 'booming', child: Text('웅장한 목소리')),
                          DropdownMenuItem(value: 'male_bright', child: Text('밝은 남성')),
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
                    onChanged: (val) => setModalState(() => selectedStyle = val!),
                    decoration: InputDecoration(labelText: '보이스 스타일'),
                  ),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(dialogContext), child: Text('취소')),
                ElevatedButton(
                  onPressed: isRegenerating ? null : () async {
                    setModalState(() => isRegenerating = true);
                    try {
                      await ApiService().regenerateVoice(
                        widget.video['_id'] ?? widget.video['id'], selectedEngine, selectedGender, selectedStyle
                      );
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('초고속 스왑 성공! 2초 후 목록에서 확인하세요.')));
                      Navigator.pop(dialogContext); // 닫기
                      Navigator.pop(context); // 목록으로 이동
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('에러: $e')));
                    } finally {
                      setModalState(() => isRegenerating = false);
                    }
                  },
                  child: isRegenerating ? Container(width: 15, height: 15, child: CircularProgressIndicator()) : Text('초고속 생성'),
                ),
              ],
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isProcessing = _currentVideo['status'] == 'processing';
    bool isCompleted = _currentVideo['status'] == 'completed';
    bool isFailed = _currentVideo['status'] == 'failed';

    return Scaffold(
      appBar: AppBar(title: Text(_currentVideo['title'] ?? '비디오 상세')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            if (isCompleted && _controller != null && _controller!.value.isInitialized)
              AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              )
            else if (isProcessing)
              Container(
                height: 300,
                width: double.infinity,
                color: Colors.black.withOpacity(0.05),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                     CircularProgressIndicator(),
                     SizedBox(height: 20),
                     Text('AI 광고 영상 제작 중...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                     SizedBox(height: 10),
                     Padding(
                       padding: const EdgeInsets.symmetric(horizontal: 40),
                       child: LinearProgressIndicator(value: (_currentVideo['progress'] ?? 0) / 100),
                     ),
                     SizedBox(height: 10),
                     Text('${_currentVideo['progress'] ?? 0}% 완료', style: TextStyle(color: Colors.deepPurple, fontWeight: FontWeight.bold)),
                  ],
                ),
              )
            else if (isFailed)
              Container(
                height: 300,
                child: Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                     Icon(Icons.error_outline, size: 50, color: Colors.red),
                     Text('영상 제작에 실패했습니다.', style: TextStyle(color: Colors.red)),
                  ],
                )),
              )
            else
              Container(height: 300, child: Center(child: CircularProgressIndicator())),
            
            ListTile(
              leading: Icon(isCompleted ? Icons.play_circle_fill : Icons.hourglass_top),
              title: Text(_currentVideo['title'] ?? '무제'),
              subtitle: Text('상태: ${_currentVideo['status']}'),
              trailing: isCompleted ? IconButton(
                icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
                onPressed: () {
                  setState(() {
                    _controller!.value.isPlaying ? _controller!.pause() : _controller!.play();
                    _isPlaying = _controller!.value.isPlaying;
                  });
                },
              ) : null,
            ),
  
            if (isProcessing && _currentVideo['statusMessages'] != null)
               Container(
                 padding: EdgeInsets.all(16),
                 child: ListView.builder(
                   shrinkWrap: true,
                   physics: NeverScrollableScrollPhysics(),
                   itemCount: (_currentVideo['statusMessages'] as List).length,
                   itemBuilder: (context, index) {
                     final msg = (_currentVideo['statusMessages'] as List).reversed.toList()[index];
                     return Padding(
                       padding: const EdgeInsets.symmetric(vertical: 4.0),
                       child: Row(
                         children: [
                           Icon(index == 0 ? Icons.check_circle : Icons.check, size: 16, color: index == 0 ? Colors.green : Colors.grey),
                           SizedBox(width: 8),
                           Expanded(child: Text(msg, style: TextStyle(color: index == 0 ? Colors.black : Colors.grey))),
                         ],
                       ),
                     );
                   },
                 ),
               ),
            
            if (isCompleted) ...[
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: ElevatedButton.icon(
                  icon: Icon(Icons.record_voice_over),
                  label: Text('음성 바꾸기 (초고속 오디오 트랙 스왑)'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                    backgroundColor: Colors.deepPurpleAccent,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: _showRegenerateDialog,
                ),
              ),
            ],
            SizedBox(height: 20),
          ],
        ),
      )
    );
  }
}
