import React, { useState, useEffect, useRef, useCallback } from 'react';
// 引入图标库
import { Heart, X, Star, User, ArrowRight, Download, CheckCircle, Loader2, Camera, RefreshCw, Check, UploadCloud, AlertCircle, Image as ImageIcon, Clock, ShoppingCart, Maximize, Minimize, RefreshCcw } from 'lucide-react';

// --- 配置 ---
// 默认地址
const DEFAULT_API_URL = 'https://crowd-municipal-unbroken.ngrok-free.dev'; 

// 问卷题目列表
const PRE_QUESTIONS = [
  "comforted",
  "supported",
  "looked after",
  "cared for",
  "secure",
  "safe",
  "protected",
  "unthreatened",
  "better about myself",
  "valued",
  "more positive about myself",
  "I really like myself",
  "loved",
  "cherished",
  "treasured",
  "adored",
];

// --- 布局组件 ---
const Layout = ({ children }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <button 
        onClick={toggleFullScreen}
        className="fixed top-4 right-4 z-50 p-2 bg-white/60 hover:bg-white backdrop-blur-md rounded-full shadow-md text-slate-600 transition-all duration-300 hover:scale-110"
        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
      >
        {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      {children}
    </div>
  );
};

// --- 摄像头组件 ---
const CameraCapture = ({ onCapture, label, instruction }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.warn("Camera access failed", err);
      setError("Camera access is unavailable. Please upload a photo instead.");
    }
  }, []);

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      startCamera();
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === 4) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result);
        };
        reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    setImage(null);
    if (!streamRef.current) {
      startCamera();
    }
  };

  const confirm = () => {
    stopCamera();
    onCapture(image);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-2 text-slate-800">{label}</h3>
      <p className="text-sm text-slate-500 mb-4">{instruction}</p>
      
      {error && <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-6 shadow-xl group">
          {!image ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
              {!stream && !error && <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Starting camera...</div>}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
                 <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 text-white border-2 border-dashed border-white rounded-full">
                    <path d="M50,10 C30,10 15,25 15,45 C15,60 25,70 30,75 C10,85 0,100 0,100 L100,100 C100,100 90,85 70,75 C75,70 85,60 85,45 C85,25 70,10 50,10 Z" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4"/>
                 </svg>
                 <p className="absolute bottom-10 text-white text-sm font-bold bg-black/50 px-3 py-1 rounded">Align face here</p>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button onClick={takePhoto} className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-slate-200 flex items-center justify-center hover:bg-slate-100 transition shadow-lg z-10" title="Take Photo"><Camera className="text-slate-800" size={32} /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition pointer-events-auto" title="Upload Photo"><UploadCloud size={20} /></button>
            </>
          ) : (
            <>
              <img src={image} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 w-full bg-black/60 p-4 flex justify-between z-20">
                <button onClick={retake} className="flex items-center gap-2 text-white hover:text-rose-400 font-medium"><RefreshCw size={20} /> Retake</button>
                <button onClick={confirm} className="flex items-center gap-2 text-white hover:text-green-400 font-bold"><Check size={20} /> Confirm</button>
              </div>
            </>
          )}
        </div>
    </div>
  );
};

// --- 主程序入口 ---
export default function App() {
  // --- 状态管理 (State) ---
  const [phase, setPhase] = useState('gender_select'); 
  // ✨ API 地址管理
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL); 
  const [tempApiUrl, setTempApiUrl] = useState(DEFAULT_API_URL);
  
  const [selfGender, setSelfGender] = useState('male');
  const [partnerGender, setPartnerGender] = useState('female');
  const [selfPhoto, setSelfPhoto] = useState(null);
  const [partnerPhoto, setPartnerPhoto] = useState(null);
  
  const [userProfileText, setUserProfileText] = useState('');
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [trialStep, setTrialStep] = useState('card'); 
  const [trialStartTime, setTrialStartTime] = useState(0); 
  const [data, setData] = useState([]); 
  const [stimuli, setStimuli] = useState([]); 
  
  const [currentTrialData, setCurrentTrialData] = useState({});
  const [ratingDesirability, setRatingDesirability] = useState(4); 
  const [ratingWillingness, setRatingWillingness] = useState(4);   
  
  const [saveStatus, setSaveStatus] = useState('idle'); 
  const [isDemoMode, setIsDemoMode] = useState(false); 
  const [profileTimer, setProfileTimer] = useState(10); 
  const [condition, setCondition] = useState('relationship'); 
  const [participantId, setParticipantId] = useState(null);

  // 照片知情同意
  const [selfPhotoConsent, setSelfPhotoConsent] = useState(null);
  const [partnerPhotoConsent, setPartnerPhotoConsent] = useState(null);

  // 后端为本次两张照片生成的文件夹编号
  const [photoBatchId, setPhotoBatchId] = useState(null);

  // 用来区分“正常完成”和“知情同意未通过”
  const [endReason, setEndReason] = useState(null);

  // 只有两个确认都是 yes，才算获得完整同意
  const consentGranted =
    selfPhotoConsent === 'yes' &&
    partnerPhotoConsent === 'yes';

  const scrollContainerRef = useRef(null);

  // 初始化条件
  useEffect(() => {
    const randomCondition = Math.random() < 0.5 ? 'relationship' : 'grocery';
    setCondition(randomCondition);
    console.log(`Experiment Condition Assigned: ${randomCondition}`);
  }, []);

    // 页面滚动和自动保存
    useEffect(() => {
        window.scrollTo(0, 0);

        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }

        // 未同意使用照片前，不向后端保存任何实验数据
        // finish 页面由“Finish Experiment”按钮执行正式保存
        const phasesWithoutAutoSave = [
            'gender_select',
            'face_instructions',
            'photo_consent',
            'finish',
            'end'
        ];

        if (consentGranted && !phasesWithoutAutoSave.includes(phase)) {
            saveDataToServer(true);
        }
    }, [phase, consentGranted]);

    // 正式实验开始后，试次数据发生变化时自动备份
    useEffect(() => {
        if (consentGranted && data.length > 0 && phase !== 'finish') {
            saveDataToServer(true);
        }
    }, [data, consentGranted, phase]);

  // --- 事件处理函数 ---

  // 处理重试逻辑 (确保只定义这一次)
  const handleRetryConnection = () => {
    setApiUrl(tempApiUrl); // 更新实际使用的 URL
    setStimuli([]);        
    setIsDemoMode(false);  
    setPhase('processing'); // 重新触发处理流程
  };

  const handleGenderConfirm = () => {
    // 先展示面孔合成说明，再取得照片使用同意
    setPhase('face_instructions');
  };

  const endBecauseConsentDeclined = () => {
    // 知情同意在照片上传前完成；退出时同时清除前端照片状态
    setSelfPhoto(null);
    setPartnerPhoto(null);
    setPhotoBatchId(null);
    setEndReason('consent_declined');
    setPhase('end');
  };

  const handleSelfConsent = (answer) => {
    setSelfPhotoConsent(answer);
  };

  const handlePartnerConsent = (answer) => {
    setPartnerPhotoConsent(answer);
  };

  const handleConsentContinue = () => {
    const bothAnswered = selfPhotoConsent !== null && partnerPhotoConsent !== null;

    if (!bothAnswered) return;

    if (consentGranted) {
      setPhase('upload_self');
    } else {
      endBecauseConsentDeclined();
    }
  };

  const handleSelfCapture = (imgData) => {
    if (!imgData) return;
    setSelfPhoto(imgData);
    setTimeout(() => { setPhase('upload_partner'); }, 100);
  };

  const handlePartnerCapture = (imgData) => {
    if (!imgData) return;
    setPartnerPhoto(imgData);
    setTimeout(() => { setPhase('processing'); }, 100);
  };

  // 倒计时逻辑
  useEffect(() => {
    let interval;
    if (phase === 'profile' && profileTimer > 0) {
      interval = setInterval(() => {
        setProfileTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, profileTimer]);

  // 生成模拟数据
  const generateMockData = () => {
    const mockStimuli = [];
    let idCounter = 1;
    for(let i=0; i<4; i++) {
        mockStimuli.push({id: `mock_self_${idCounter++}`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=self${i}`, type: 'self_morph', ratio_self: (i % 6) * 0.2, description: `Self Morph ${(i%6)*20}% (Demo)`});
    }
    for(let i=0; i<4; i++) {
        mockStimuli.push({id: `mock_partner_${idCounter++}`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=partner${i}`, type: 'partner_morph', ratio_partner: (i % 6) * 0.2, description: `Partner Morph ${(i%6)*20}% (Demo)`});
    }
    for(let i=0; i<4; i++) {
        mockStimuli.push({id: `mock_random_${idCounter++}`, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=random${i}`, type: 'random_opposite', ratio_self: 0, description: `Random Face (Demo)`});
    }
    return mockStimuli.sort(() => Math.random() - 0.5);
  };

  // 核心：处理图片请求 (✅ 已彻底移除超时限制，并使用动态 URL)
  useEffect(() => {
    if (phase === 'processing') {
      const processImages = async () => {
        try {
          console.log("Connecting to backend:", apiUrl);
          
          const response = await fetch(`${apiUrl}/merge_faces`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'ngrok-skip-browser-warning': 'true' 
            },
            body: JSON.stringify({
              self_image: selfPhoto,
              partner_image: partnerPhoto,
              self_gender: selfGender,
              partner_gender: partnerGender
            }),
            // ❌ 这里没有 signal 和 timeout，前端会一直等待后端响应
          });
          
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server status ${response.status}: ${errText.slice(0, 100)}`);
          }
          
          const result = await response.json();
          setStimuli(result.images);
          setPhotoBatchId(result.photo_batch_id || null);
          setPhase('instructions');

        } catch (error) {
          console.warn("Backend connection failed:", error);
          
          // 进入演示模式，但在界面上允许重试
          setIsDemoMode(true); 
          const mockData = generateMockData();
          setStimuli(mockData); 
          setPhotoBatchId(null);
          setPhase('instructions'); 
        }
      };
      processImages();
    }
  }, [phase, apiUrl]); // 依赖 apiUrl，修改地址后会自动重试

  // 记录试次开始时间
  useEffect(() => {
    if (phase === 'experiment' && trialStep === 'card') {
      setTrialStartTime(performance.now());
    }
  }, [phase, trialStep, currentTrialIndex]);

  // 数据保存逻辑
  const saveDataToServer = async (isPartial = false, isComplete = false) => {
    if (!isPartial) setSaveStatus('saving');

    const exportData = {
      participant_id: participantId,
      timestamp: new Date().toISOString(),
      condition_group: condition,
      gender_info: { self: selfGender, partner: partnerGender },
      photo_consent: {
        self_photo: selfPhotoConsent,
        partner_photo: partnerPhotoConsent
      },
      photo_batch_id: photoBatchId,
      user_profile: userProfileText,
      pre_questionnaire: questionnaireAnswers,
      experiment_data: data,
      mode: isDemoMode ? 'demo' : 'production',
      is_complete: isComplete
    };

    if (isDemoMode) {
        if (!isPartial) setSaveStatus('saved');
        return true;
    }

    try {
      const response = await fetch(`${apiUrl}/save_data`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'ngrok-skip-browser-warning': 'true'
         },
         body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.participant_id) {
        setParticipantId(result.participant_id);
      }
      if (!isPartial) setSaveStatus('saved');
      return true;
    } catch (e) {
      console.error(e);
      if (!isPartial) setSaveStatus('error');
      return false;
    }
  };

  // 完成实验后，通知后端删除本次上传的两张照片
  const deleteParticipantFaces = async () => {
    if (isDemoMode || !photoBatchId) return true;

    try {
      const response = await fetch(`${apiUrl}/delete_participant_faces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ photo_batch_id: photoBatchId })
      });

      if (!response.ok) {
        throw new Error('Photo deletion failed');
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleFinishExperiment = async () => {
    const dataSaved = await saveDataToServer(false, true);
    if (!dataSaved) return;

    const photosDeleted = await deleteParticipantFaces();
    if (!photosDeleted) {
      setSaveStatus('error');
      return;
    }

    // 后端删除成功后，也清除浏览器内存中的照片数据
    setSelfPhoto(null);
    setPartnerPhoto(null);
    setPhotoBatchId(null);
    setEndReason('completed');
    setPhase('end');
  };

  // --- Views ---

  if (phase === 'gender_select') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-20">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h1 className="text-2xl font-bold text-center mb-6">Basic Information</h1>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Gender</label>
              <div className="flex gap-4">
                <button onClick={() => setSelfGender('male')} className={`flex-1 py-3 rounded-lg border-2 ${selfGender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200'}`}>Male</button>
                <button onClick={() => setSelfGender('female')} className={`flex-1 py-3 rounded-lg border-2 ${selfGender === 'female' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}>Female</button>
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Partner&apos;s Gender (or Preferred)</label>
              <div className="flex gap-4">
                <button onClick={() => setPartnerGender('male')} className={`flex-1 py-3 rounded-lg border-2 ${partnerGender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200'}`}>Male</button>
                <button onClick={() => setPartnerGender('female')} className={`flex-1 py-3 rounded-lg border-2 ${partnerGender === 'female' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'}`}>Female</button>
              </div>
            </div>
            <button onClick={handleGenderConfirm} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Next</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'face_instructions') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-20 min-h-screen">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Face Morphing Task</h2>
            <div className="text-slate-600 space-y-4 mb-8 leading-relaxed">
              <p>In this part of the study, you will be asked to upload one photograph of yourself and one photograph of your partner.</p>
              <p>These photographs will be used solely to create computer-generated face-morph images for this study. You will then view the resulting images and complete a series of face-rating tasks.</p>
              <p>The photographs will be stored locally on the research computer, will be accessible only to the researcher, will not be shared with any third party, and will be permanently deleted after you complete the experiment.</p>
            </div>
            <button onClick={() => setPhase('photo_consent')} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Continue</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'photo_consent') {
    const bothAnswered = selfPhotoConsent !== null && partnerPhotoConsent !== null;

    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-20 min-h-screen">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-3 text-slate-800">Photo Use Confirmation</h2>
            <p className="text-slate-600 mb-8">Please answer both statements below. After both answers have been selected, click Next to continue.</p>

            <div className="mb-8 border-b border-slate-200 pb-8">
              <p className="text-slate-700 leading-relaxed mb-4">1. I confirm that I have read and understood the information previously provided about this study, and I consent to the use of my photograph solely for facial synthesis in this study.</p>
              <div className="flex gap-4">
                <button type="button" onClick={() => handleSelfConsent('yes')} className={`flex-1 py-3 rounded-xl border-2 font-bold ${selfPhotoConsent === 'yes' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-700'}`}>Yes</button>
                <button type="button" onClick={() => handleSelfConsent('no')} className={`flex-1 py-3 rounded-xl border-2 font-bold ${selfPhotoConsent === 'no' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'}`}>No</button>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-slate-700 leading-relaxed mb-4">2. I confirm that my partner has received the relevant study information and has consented to the use of their photograph solely for facial synthesis in this study.</p>
              <div className="flex gap-4">
                <button type="button" onClick={() => handlePartnerConsent('yes')} className={`flex-1 py-3 rounded-xl border-2 font-bold ${partnerPhotoConsent === 'yes' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-700'}`}>Yes</button>
                <button type="button" onClick={() => handlePartnerConsent('no')} className={`flex-1 py-3 rounded-xl border-2 font-bold ${partnerPhotoConsent === 'no' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'}`}>No</button>
              </div>
            </div>

            <button type="button" disabled={!bothAnswered} onClick={handleConsentContinue} className={`w-full font-bold py-3 rounded-xl transition ${bothAnswered ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Next</button>
          </div>
        </div>
      </Layout>
    );
  }

    if (phase === 'upload_self') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-20">
            <div className="w-full bg-white p-6 rounded-2xl shadow-xl max-w-md">
            <div className="flex justify-center mb-4"><div className="w-full h-2 bg-slate-100 rounded-full"><div className="h-full bg-rose-500 w-1/3"></div></div></div>
            <CameraCapture key="capture-self" label="Step 1/2: Take Your Photo" instruction="Please use a white background. Ensure your face is clear and well-lit." onCapture={handleSelfCapture} />
            </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'upload_partner') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-20">
            <div className="w-full bg-white p-6 rounded-2xl shadow-xl max-w-md">
            <div className="flex justify-center mb-4"><div className="w-full h-2 bg-slate-100 rounded-full"><div className="h-full bg-rose-500 w-2/3"></div></div></div>
            <CameraCapture key="capture-partner" label="Step 2/2: Take Partner's Photo" instruction="If partner is not present, you can upload an existing photo." onCapture={handlePartnerCapture} />
            </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'processing') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-20 h-screen bg-slate-900">
          <Loader2 size={64} className="animate-spin text-rose-500 mb-6" />
          <h2 className="text-2xl font-bold mb-4 text-white text-center">Creating the Face-Morph Images...</h2>
          <div className="text-slate-300 text-sm space-y-3 text-center max-w-md">
            <p>This process usually takes about 2 minutes.</p>
            <p>Please keep this page open and do not refresh or close your browser.</p>
            <p className="text-slate-400">Your photographs are being processed on the research computer.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'instructions') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-20">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Ready</h2>
            
            {isDemoMode && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-sm">
                  <div className="flex items-start gap-2 text-amber-800 mb-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5"/>
                    <div>
                      <strong>Connection Failed</strong>
                      <p className="opacity-90 mt-1">Backend not reachable. You are in Demo Mode (using mock data).</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 p-3 rounded-lg">
                    <label className="block text-xs font-bold text-amber-800 mb-1">Update Ngrok URL & Retry:</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tempApiUrl} 
                        onChange={(e) => setTempApiUrl(e.target.value)}
                        className="flex-1 border border-amber-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-amber-500"
                        placeholder="e.g. https://xxxx.ngrok-free.app"
                      />
                      <button 
                        onClick={handleRetryConnection}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition"
                      >
                        <RefreshCcw size={12} /> Retry
                      </button>
                    </div>
                  </div>
                </div>
            )}

            <p className="text-slate-600 mb-6 text-sm">System has prepared potential matches. Please follow your intuition.</p>
            <button onClick={() => setPhase('profile')} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">Start Experiment</button>
            </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'profile') {
     const minutes = Math.floor(profileTimer / 60);
     const seconds = profileTimer % 60;
     return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 pt-10">
            <div ref={scrollContainerRef} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className={`p-3 rounded-full ${condition === 'relationship' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-500'}`}>
                {condition === 'relationship' ? <Heart size={24} fill="currentColor" /> : <ShoppingCart size={24} />}
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{condition === 'relationship' ? 'Relationship Reflection' : 'Shopping Experience'}</h2>
            </div>
            <div className="text-slate-600 space-y-4 mb-8 text-sm leading-relaxed text-justify">
                {condition === 'relationship' ? (
                    <>
                        <p>To improve your relationship quality, science has proven that the following method can be very helpful. <span className="font-semibold text-rose-600 block mt-1">Let's give it a try!</span></p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="mb-2">Please take time to think carefully about a <strong>close relationship</strong> in which you find it easy to feel close to the other person and are comfortable relying on them. </p>
                            <p>This person you are thinking about should be someone who is <strong>always there for you</strong> when you are in need.</p>
                        </div>
                        <p>You should now have a person in mind. Please imagine what they look like and what it is like to be in their company.</p>
                        <p>Now you have the person in mind, think about how you do not worry about being abandoned by this person or worry that this person would try to get closer to you than you are comfortable being.</p>
                        <p>Please write about this person, your shared time together, and how this person makes you feel safe, comforted, and loved. There may be a particular time or example of these good things in the relationship that you could recall here. The task will be timed.</p>
                    </>
                ) : (
                    <>
                        <p>This page requires you to identify and write for 10 minutes (in the box below) about a recent retail experience you had. We won’t read or keep what you write (though we will check that you have written at least a few paragraphs of text), so please feel free to write in a disinhibited and unguarded way. The exercise is just about having you visualise a situation.</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="mb-2">Please take time to think carefully about a time when you visited a <strong>grocery store alone</strong> to buy grocery products.</p>
                            <p>This must be a time when you were out shopping alone, with no friends or acquaintances.</p>
                        </div>
                        <p>You should now have a recent shopping time in mind. Please imagine the details of this trip.</p>
                        <p>Now you have the particular shopping trip in mind, imagine and describe the route from your home to the store, the appearance of the store, the ease with which you found what you were looking for and the groceries you purchased.</p>
                        <p>Please write down as much as you can about this grocery store trip. The task will be timed with a 10-minute countdown timer.</p>
                    </>
                )}
            </div>
            <div className="mb-6">
                <label className="block text-slate-700 font-bold mb-2 flex items-center gap-2 justify-between flex-wrap">
                    <span>Your Response:</span>
                    {profileTimer > 0 && (<span className="text-xs font-normal text-rose-500 bg-rose-50 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"><Clock size={12}/> Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}</span>)}
                </label>
                <textarea className="w-full border border-slate-300 rounded-xl p-4 h-48 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all resize-none text-sm leading-relaxed" 
                    placeholder={condition === 'relationship' ? "There may be a particular time or example of these good things in the relationship that you could recall here. The task will be timed." : "Please write down as much as you can about this grocery store trip. The task will be timed."}
                    value={userProfileText} onChange={e=>setUserProfileText(e.target.value)} 
                />
            </div>
            <button disabled={profileTimer > 0} onClick={() => setPhase('questionnaire')} className={`w-full font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${profileTimer > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}`}>
                {profileTimer > 0 ? <><Loader2 className="animate-spin" size={20} /><span className="whitespace-nowrap">Please reflect & write ({minutes}:{seconds.toString().padStart(2, '0')})</span></> : <><span>Next Step</span><ArrowRight size={20} /></>}
            </button>
            </div>
        </div>
      </Layout>
     );
  }

  if (phase === 'questionnaire') {
    const isComplete = Object.keys(questionnaireAnswers).length === PRE_QUESTIONS.length;
    return (
      <Layout>
        <div className="flex justify-center p-6 pt-20 min-h-screen">
            <div ref={scrollContainerRef} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[85vh]">
            <h2 className="text-xl font-bold mb-4">Ratings</h2>
            {PRE_QUESTIONS.map((q, idx) => (
                <div key={idx} className="mb-4 text-sm">
                    <p className="mb-2">{idx + 1}. {q}</p>
                    <div className="flex justify-between">{[1,2,3,4,5,6,7].map(n=><button key={n} onClick={()=>setQuestionnaireAnswers(p=>({...p,[idx]:n}))} className={`w-8 h-8 rounded-full ${questionnaireAnswers[idx]===n?'bg-rose-500 text-white':'bg-slate-100'}`}>{n}</button>)}</div>
                </div>
                ))}
                <button disabled={!isComplete} onClick={() => setPhase('experiment')} className={`w-full mt-4 font-bold py-3 rounded-xl ${!isComplete?'bg-slate-300':'bg-slate-900 text-white'}`}>Start Browsing (36 Photos)</button>
            </div>
        </div>
      </Layout>
    );
  }

  const handleCardAction = (action) => {
    const rt = performance.now() - trialStartTime;
    const stim = stimuli[currentTrialIndex];
    setCurrentTrialData({
      trial_index: currentTrialIndex + 1,
      stimulus_id: stim.id,
      stimulus_type: stim.type, 
      ratio_level: stim.ratio_self || stim.ratio_partner || 0,
      source_db_image: stim.source_db,
      source_upload_image: stim.source_upload,
      action: action,
      reaction_time_ms: Math.round(rt),
    });
    setRatingDesirability(4); setRatingWillingness(4); setTrialStep('rating');
  };

  const handleRatingSubmit = () => {
    const completeData = { ...currentTrialData, rating_desirability: ratingDesirability, rating_willingness: ratingWillingness };
    const newData = [...data, completeData];
    setData(newData);
    if (currentTrialIndex < stimuli.length - 1) {
      setCurrentTrialIndex(prev => prev + 1);
      setTrialStep('card');
    } else {
      setPhase('finish');
    }
  };

  if (phase === 'experiment' && trialStep === 'card') {
    const currentStim = stimuli[currentTrialIndex];
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-4 min-h-screen">
            <div className="w-full max-w-sm mb-4 h-1.5 bg-slate-200 rounded-full"><div className="h-full bg-rose-500 transition-all" style={{ width: `${((currentTrialIndex+1)/stimuli.length)*100}%` }} /></div>
            <div className="relative w-full max-w-sm aspect-[3/4] bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
            <img src={currentStim.url} className="w-full h-full object-cover" alt="Stimulus" />
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white pt-20">
                <h3 className="text-sm font-light opacity-50">{currentStim.description}</h3>
            </div>
            </div>
            <div className="flex items-center gap-6">
            <button onClick={() => handleCardAction('dislike')} className="w-16 h-16 bg-white rounded-full shadow-lg text-rose-500 flex items-center justify-center hover:scale-110 transition"><X size={32} /></button>
            <button onClick={() => handleCardAction('superlike')} className="w-12 h-12 bg-white rounded-full shadow text-blue-400 flex items-center justify-center hover:scale-110 transition -mt-2"><Star size={24} /></button>
            <button onClick={() => handleCardAction('like')} className="w-16 h-16 bg-rose-500 rounded-full shadow-lg text-white flex items-center justify-center hover:scale-110 transition"><Heart size={32} fill="currentColor" /></button>
            </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'experiment' && trialStep === 'rating') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 min-h-screen">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-center mb-6">What do you think about him/her?</h2>
            <div className="mb-6"><label className="block mb-2 font-bold text-slate-700">Desirability: {ratingDesirability}</label><input type="range" min="1" max="7" value={ratingDesirability} onChange={e => setRatingDesirability(Number(e.target.value))} className="w-full accent-rose-500" /></div>
            <div className="mb-8"><label className="block mb-2 font-bold text-slate-700">Willingness to Date: {ratingWillingness}</label><input type="range" min="1" max="7" value={ratingWillingness} onChange={e => setRatingWillingness(Number(e.target.value))} className="w-full accent-rose-500" /></div>
            <button onClick={handleRatingSubmit} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">Confirm</button>
            </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'finish') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-screen">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Thank You</h2>
            <p className="text-slate-600 mb-4">Thank you for taking part in this study. We sincerely appreciate your time and participation.</p>
            <p className="text-slate-600 mb-8">
              For more information, please visit the{' '}
              <a href="https://www.un.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">United Nations website</a>.
            </p>

            <button type="button" onClick={handleFinishExperiment} disabled={saveStatus === 'saving'} className={`w-full font-bold py-4 rounded-xl ${saveStatus === 'saving' ? 'bg-slate-300 text-slate-500 cursor-wait' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              {saveStatus === 'saving' ? 'Saving Data...' : 'Finish Experiment'}
            </button>

            {saveStatus === 'error' && <p className="text-red-500 font-bold mt-4">Data could not be saved or the photographs could not be deleted. Please keep this page open and try again.</p>}
            {isDemoMode && <p className="text-xs text-amber-500 mt-4">Demo mode is active; no data was sent to the research computer.</p>}
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'end') {
    const consentWasDeclined = endReason === 'consent_declined';

    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-screen">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            {consentWasDeclined ? (
              <AlertCircle size={64} className="text-slate-500 mx-auto mb-6" />
            ) : (
              <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            )}
            <h2 className="text-2xl font-bold mb-4">{consentWasDeclined ? 'Experiment Ended' : 'Experiment Complete'}</h2>
            <p className="text-slate-600 leading-relaxed">
              {consentWasDeclined
                ? 'Thank you for your time. Because consent to use both photographs was not confirmed, you will not be able to continue with this study. No photographs have been uploaded or processed. You may now close this page.'
                : 'Thank you for your participation. Your responses have been recorded, and the photographs uploaded for this study have been deleted. You may now close this page.'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
