import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'video_detail_screen.dart';
import 'face_effect_screen.dart';
import 'video_generate_screen.dart';

class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _videos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final videos = await _apiService.fetchVideos();
      setState(() => _videos = videos);
    } catch (e) {
      print('Fetch error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('내 광고 보관함', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: Icon(Icons.refresh), onPressed: _fetchData),
          IconButton(
            icon: Icon(Icons.face_retouching_natural, color: Colors.amber), 
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => FaceEffectScreen()))
          ),
        ],
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator()) 
        : _videos.isEmpty 
          ? Center(child: Text('생성된 영상이 없습니다.\n우측 하단 버튼을 눌러 새로 만드세요!', textAlign: TextAlign.center))
          : ListView.builder(
              itemCount: _videos.length,
              itemBuilder: (context, index) {
                final video = _videos[index];
                return Card(
                  margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    contentPadding: EdgeInsets.all(12),
                    leading: Container(
                      width: 60, height: 60, color: Colors.black12,
                      child: Icon(Icons.video_library, size: 40, color: Colors.blueAccent),
                    ),
                    title: Text(video['title'] ?? '무제', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text('엔진: ${video['voiceSettings']?['engine'] ?? 'minimax'} | 처리: ${video['status']}'),
                    ),
                    trailing: Icon(Icons.chevron_right),
                    onTap: () {
                      if (video['status'] == 'completed' || video['status'] == 'processing') {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => VideoDetailScreen(video: video)));
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('영상 처리에 실패했습니다. 다시 시도해주세요.')));
                      }
                    },
                  ),
                );
              }
            ),
      floatingActionButton: FloatingActionButton.extended(
        icon: Icon(Icons.add),
        label: Text('새 영상 생성'),
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => VideoGenerateScreen()));
        },
      ),
    );
  }
}
