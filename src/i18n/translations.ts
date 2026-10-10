export interface TranslationDictionary {
  appName: string;
  tagline: string;
  heroDescription: string;
  continueButton: string;
  welcomeFeatures: {
    title: string;
    desc: string;
  }[];
  mainTitle: string;
  mainSubtitle: string;
  langToggleEn: string;
  langToggleTe: string;
  reportLangLabel: string;
  speechLangLabel: string;
  speechLangEn: string;
  speechLangTe: string;
  speechLangAuto: string;
  uploadTitle: string;
  uploadSubtitle: string;
  chooseImage: string;
  orDragDrop: string;
  replaceImage: string;
  removeImage: string;
  invalidFileType: string;
  imageTooLarge: string;
  descPlaceholder: string;
  quickSymptomsLabel: string;
  quickSymptoms: string[];
  micListening: string;
  micInterimHint: string;
  micStart: string;
  micStop: string;
  micRecognized: string;
  micNoSpeech: string;
  micPermissionDenied: string;
  micUnavailable: string;
  micAudioCapture: string;
  optionalDetailsTitle: string;
  optionalDetailsDesc: string;
  farmerNameLabel: string;
  farmerNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  cropLabel: string;
  cropPlaceholder: string;
  growthStageLabel: string;
  growthStagePlaceholder: string;
  problemDurationLabel: string;
  problemDurationPlaceholder: string;
  recentPracticesLabel: string;
  recentPracticesPlaceholder: string;
  analyzeButton: string;
  analyzingButton: string;
  validationError: string;
  backendError: string;
  translatingReport: string;
  translationError: string;
  
  // 13 Report Section Titles
  reportTitle: string;
  reportSubtitle: string;
  sec1_summaryTitle: string;
  sec2_observationsTitle: string;
  sec3_whatHappenedTitle: string;
  sec4_causesTitle: string;
  sec5_confidenceTitle: string;
  sec6_uncertaintiesTitle: string;
  sec7_recommendedActionsTitle: string;
  sec8_immediateChecksTitle: string;
  sec9_precautionsAvoidTitle: string;
  sec10_monitoringTitle: string;
  sec11_preventionTitle: string;
  sec12_expertHelpTitle: string;
  sec13_limitationsTitle: string;

  // Labels inside report
  reportedSymptomsLabel: string;
  whyFitsLabel: string;
  missingEvidenceLabel: string;
  confidenceLevelLabel: string;
  obsVsInterpLabel: string;
  furtherTestingLabel: string;
  expertOfficesLabel: string;
  disclaimerLabel: string;
  
  // Audio playback controls
  audioPlay: string;
  audioPause: string;
  audioResume: string;
  audioStop: string;
  audioSpeedLabel: string;
  audioNoVoiceNotice: string;
  
  // Action buttons
  printButton: string;
  analyzeAnotherButton: string;
  startNewButton: string;
  n8nSettingsLabel: string;
  n8nEndpointPlaceholder: string;
  n8nConnected: string;
  n8nNotConnected: string;
}

export const translations: Record<'en' | 'te', TranslationDictionary> = {
  en: {
    appName: "AgriPilot",
    tagline: "Your AI Farming Companion",
    heroDescription: "Understand crop problems. Discover possible causes. Get practical farming guidance.",
    continueButton: "Continue to AgriPilot",
    welcomeFeatures: [
      {
        title: "Visual Crop Diagnosis",
        desc: "Upload a photo from your field or phone gallery for visual symptom detection."
      },
      {
        title: "Bilingual Voice & Text",
        desc: "Describe what happened naturally in Telugu or English using voice or text."
      },
      {
        title: "Calibrated Scientific Advice",
        desc: "Actionable remedies, precautions to avoid, and local KVK agricultural guidance."
      }
    ],
    mainTitle: "Crop Health Assessment",
    mainSubtitle: "Upload a crop photo, speak through the mic, or describe symptoms below.",
    langToggleEn: "English",
    langToggleTe: "తెలుగు",
    reportLangLabel: "Report Generation Language",
    speechLangLabel: "Microphone Speech Language",
    speechLangEn: "English Speech (en-IN)",
    speechLangTe: "Telugu Speech (te-IN)",
    speechLangAuto: "Auto-detect (Current App Language)",
    uploadTitle: "Upload Crop Image",
    uploadSubtitle: "Select from gallery or computer (JPG, PNG, WebP up to 10MB)",
    chooseImage: "Select Image",
    orDragDrop: "or drag and drop your crop photo here",
    replaceImage: "Change Image",
    removeImage: "Remove Image",
    invalidFileType: "Please upload a valid image file (JPG, JPEG, PNG, or WebP).",
    imageTooLarge: "Image size exceeds 10MB. Please choose a smaller photo.",
    descPlaceholder: "Describe what happened to your crop in Telugu or English...",
    quickSymptomsLabel: "Quick Symptom Examples (Tap to add):",
    quickSymptoms: [
      "Leaves turning yellow.",
      "Brown spots appearing on leaves.",
      "Plants suddenly wilting.",
      "Holes appearing in leaves.",
      "Flowers or fruits falling prematurely.",
      "Slow plant growth."
    ],
    micListening: "Listening... Speak naturally now.",
    micInterimHint: "Hearing: ",
    micStart: "Speak (Voice Input)",
    micStop: "Stop Voice",
    micRecognized: "Speech recognized successfully.",
    micNoSpeech: "No speech was detected. Please try speaking again.",
    micPermissionDenied: "Microphone permission was denied. Please allow microphone access in your browser settings.",
    micUnavailable: "Speech recognition is unavailable in this browser. You can type your description instead.",
    micAudioCapture: "No microphone was found on this device.",
    optionalDetailsTitle: "Optional Farmer & Field Details",
    optionalDetailsDesc: "Help us provide more tailored recommendations (none are required).",
    farmerNameLabel: "Farmer Name",
    farmerNamePlaceholder: "e.g., Ramesh Kumar",
    emailLabel: "Email Address",
    emailPlaceholder: "e.g., farmer@example.com",
    locationLabel: "Location / Village & District",
    locationPlaceholder: "e.g., Warangal, Telangana / Guntur, AP",
    cropLabel: "Crop Name",
    cropPlaceholder: "e.g., Paddy (Rice), Cotton, Chilli, Tomato, Groundnut",
    growthStageLabel: "Crop Growth Stage",
    growthStagePlaceholder: "Select growth stage...",
    problemDurationLabel: "When did the problem start?",
    problemDurationPlaceholder: "e.g., 3 days ago, after heavy rain",
    recentPracticesLabel: "Recent Irrigation, Fertilizers or Pesticides",
    recentPracticesPlaceholder: "e.g., Applied urea 5 days ago, watered yesterday",
    analyzeButton: "Analyze My Crop",
    analyzingButton: "Analyzing Your Crop...",
    validationError: "Please provide either an image of your crop, a symptom description, or both.",
    backendError: "Unable to complete analysis. Please check your network connection and try again.",
    translatingReport: "Translating full report to the selected language while preserving agricultural facts...",
    translationError: "Failed to translate report. The existing report has been preserved.",
    
    // 13 Sections
    reportTitle: "Your AgriPilot Crop Health Report",
    reportSubtitle: "Personalized agronomic evaluation based on visible signs and farmer observations.",
    sec1_summaryTitle: "1. Crop Problem Summary",
    sec2_observationsTitle: "2. Image Observations",
    sec3_whatHappenedTitle: "3. What May Have Happened",
    sec4_causesTitle: "4. Possible Causes Supported by Evidence",
    sec5_confidenceTitle: "5. Assessment and Confidence",
    sec6_uncertaintiesTitle: "6. Key Uncertainties",
    sec7_recommendedActionsTitle: "7. Recommended Field Actions",
    sec8_immediateChecksTitle: "8. Immediate Field Checks",
    sec9_precautionsAvoidTitle: "9. Treatment Precautions & Actions to Avoid",
    sec10_monitoringTitle: "10. What to Monitor Next",
    sec11_preventionTitle: "11. Prevention and Future Care",
    sec12_expertHelpTitle: "12. When to Contact an Agricultural Expert",
    sec13_limitationsTitle: "13. Sources and Limitations",

    reportedSymptomsLabel: "Reported Farmer Symptoms",
    whyFitsLabel: "Why this fits available evidence",
    missingEvidenceLabel: "Missing or confirming evidence required",
    confidenceLevelLabel: "Confidence Level",
    obsVsInterpLabel: "Scientific Distinction (Observation vs Interpretation)",
    furtherTestingLabel: "Follow-up Diagnostic Testing",
    expertOfficesLabel: "Recommended Agricultural Institutions",
    disclaimerLabel: "Advisory Notice",

    audioPlay: "Listen to Report",
    audioPause: "Pause",
    audioResume: "Resume",
    audioStop: "Stop Audio",
    audioSpeedLabel: "Speed",
    audioNoVoiceNotice: "A native English voice was selected. Audio is reading the complete report.",

    printButton: "Print / Save Report (PDF)",
    analyzeAnotherButton: "Analyze Another Crop",
    startNewButton: "Start New Consultation",
    n8nSettingsLabel: "n8n Workflow Settings",
    n8nEndpointPlaceholder: "https://your-n8n.instance/webhook/agripilot",
    n8nConnected: "Connected to n8n Webhook",
    n8nNotConnected: "Using AgriPilot AI Engine (Gemini 3.8 Flash)"
  },
  te: {
    appName: "AgriPilot (అగ్రిపైలట్)",
    tagline: "మీ AI వ్యవసాయ సహచరుడు",
    heroDescription: "పంట సమస్యలను అర్థం చేసుకోండి. సంభావ్య కారణాలను తెలుసుకోండి. ఆచరణాత్మక వ్యవసాయ మార్గదర్శకత్వాన్ని పొందండి.",
    continueButton: "అగ్రిపైలట్ ప్రారంభించండి",
    welcomeFeatures: [
      {
        title: "పంట ఫోటో విశ్లేషణ",
        desc: "లక్షణాలను గుర్తించడానికి మీ పొలం లేదా ఫోన్ గ్యాలరీ నుండి పంట ఫోటోను అప్‌లోడ్ చేయండి."
      },
      {
        title: "తెలుగు & ఇంగ్లీష్ వాయిస్",
        desc: "మైక్రోఫోన్ ద్వారా తెలుగులో మాట్లాడి లేదా టైప్ చేసి సమస్యను సహజంగా వివరించండి."
      },
      {
        title: "నిపుణుల వ్యవసాయ సూచనలు",
        desc: "వెంటనే చేయవలసిన నివారణలు, చేయకూడని పనులు, కృషి విజ్ఞాన కేంద్రం (KVK) మార్గదర్శకత్వం."
      }
    ],
    mainTitle: "పంట ఆరోగ్య విశ్లేషణ",
    mainSubtitle: "పంట ఫోటోను అప్‌లోడ్ చేయండి, మైక్రోఫోన్‌లో మాట్లాడండి లేదా కింద రాయండి.",
    langToggleEn: "English",
    langToggleTe: "తెలుగు",
    reportLangLabel: "నివేదిక ఉత్పత్తి భాష",
    speechLangLabel: "మైక్రోఫోన్ మాటల భాష",
    speechLangEn: "ఇంగ్లీష్ మాటలు (en-IN)",
    speechLangTe: "తెలుగు మాటలు (te-IN)",
    speechLangAuto: "స్వయంచాలక (యాప్ భాషను అనుసరించండి)",
    uploadTitle: "పంట ఫోటోను అప్‌లోడ్ చేయండి",
    uploadSubtitle: "గ్యాలరీ లేదా కంప్యూటర్ నుండి ఎంచుకోండి (JPG, PNG, WebP గరిష్టంగా 10MB)",
    chooseImage: "ఫోటోను ఎంచుకోండి",
    orDragDrop: "లేదా పంట ఫోటోను ఇక్కడికి డ్రాగ్ చేయండి",
    replaceImage: "ఫోటో మార్చండి",
    removeImage: "ఫోటో తొలగించండి",
    invalidFileType: "దయచేసి సరైన ఫోటో ఫైల్ (JPG, JPEG, PNG, లేదా WebP) ఎంచుకోండి.",
    imageTooLarge: "ఫోటో పరిమాణం 10MB కంటే ఎక్కువగా ఉంది. చిన్న ఫోటోను ఎంచుకోండి.",
    descPlaceholder: "మీ పంటకు ఏమి జరిగిందో తెలుగు లేదా ఇంగ్లీషులో వివరించండి...",
    quickSymptomsLabel: "త్వరిత లక్షణాలు (జోడించడానికి నొక్కండి):",
    quickSymptoms: [
      "ఆకులు పసుపు రంగులోకి మారుతున్నాయి.",
      "ఆకులపై గోధుమ రంగు మచ్చలు కనిపిస్తున్నాయి.",
      "మొక్కలు అకస్మాత్తుగా వాడిపోతున్నాయి.",
      "ఆకులలో రంధ్రాలు పడుతున్నాయి.",
      "పూత లేదా కాయలు రాలిపోతున్నాయి.",
      "మొక్కల పెరుగుదల మందగించింది."
    ],
    micListening: "వింటోంది... ఇప్పుడు స్పష్టంగా మాట్లాడండి.",
    micInterimHint: "గ్రహిస్తున్నది: ",
    micStart: "మాట్లాడండి (వాయిస్ ఇన్‌పుట్)",
    micStop: "వాయిస్ ఆపండి",
    micRecognized: "మాటలు విజయవంతంగా నమోదు చేయబడ్డాయి.",
    micNoSpeech: "మాటలు ఏవీ వినబడలేదు. దయచేసి మళ్ళీ మాట్లాడండి.",
    micPermissionDenied: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్‌లలో మైక్రోఫోన్ అనుమతించండి.",
    micUnavailable: "ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు అందుబాటులో లేదు. మీరు కింద టైప్ చేయవచ్చు.",
    micAudioCapture: "ఈ పరికరంలో మైక్రోఫోన్ కనుగొనబడలేదు.",
    optionalDetailsTitle: "రైతు & పొలం వివరాలు (ఐచ్ఛికం)",
    optionalDetailsDesc: "ఖచ్చితమైన సలహా ఇవ్వడానికి సహాయపడుతుంది (ఏదీ తప్పనిసరి కాదు).",
    farmerNameLabel: "రైతు పేరు",
    farmerNamePlaceholder: "ఉదా: రమేష్ రావు",
    emailLabel: "ఈమెయిల్ చిరునామా",
    emailPlaceholder: "ఉదా: farmer@example.com",
    locationLabel: "గ్రామం & జిల్లా / ప్రాంతం",
    locationPlaceholder: "ఉదా: వరంగల్, తెలంగాణ / గుంటూరు, ఆంధ్రప్రదేశ్",
    cropLabel: "పంట పేరు",
    cropPlaceholder: "ఉదా: వరి, పత్తి, మిరప, టమోటా, వేరుశనగ",
    growthStageLabel: "పంట పెరుగుదల దశ",
    growthStagePlaceholder: "దశను ఎంచుకోండి...",
    problemDurationLabel: "సమస్య ఎప్పుడు ప్రారంభమైంది?",
    problemDurationPlaceholder: "ఉదా: 3 రోజుల క్రితం, భారీ వర్షం తర్వాత",
    recentPracticesLabel: "ఇటీవలి నీటిపారుదల, ఎరువులు లేదా పురుగుమందులు",
    recentPracticesPlaceholder: "ఉదా: 5 రోజుల క్రితం యూరియా వేశాను",
    analyzeButton: "నా పంటను విశ్లేషించండి",
    analyzingButton: "పంటను విశ్లేషిస్తోంది...",
    validationError: "దయచేసి పంట ఫోటోను అప్‌లోడ్ చేయండి లేదా సమస్య లక్షణాలను వివరించండి.",
    backendError: "విశ్లేషణను పూర్తి చేయలేకపోయాము. దయచేసి నెట్‌వర్క్ తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి.",
    translatingReport: "వ్యవసాయ వాస్తవాలను భద్రపరుస్తూ పూర్తి నివేదికను తెలుగులోకి అనువదిస్తోంది...",
    translationError: "నివేదికను అనువదించలేకపోయాము. ఇప్పటికే ఉన్న నివేదిక భద్రపరచబడింది.",
    
    // 13 Sections Telugu
    reportTitle: "మీ అగ్రిపైలట్ పంట ఆరోగ్య నివేదిక",
    reportSubtitle: "కనిపించే సంకేతాలు మరియు రైతు పరిశీలనలపై ఆధారపడిన సమగ్ర వ్యవసాయ సమీక్ష.",
    sec1_summaryTitle: "1. పంట సమస్య సారాంశం",
    sec2_observationsTitle: "2. ఫోటో పరిశీలనలు",
    sec3_whatHappenedTitle: "3. ఏమి జరిగి ఉండవచ్చు",
    sec4_causesTitle: "4. ఆధారాలతో కూడిన సంభావ్య కారణాలు",
    sec5_confidenceTitle: "5. అంచనా మరియు విశ్వసనీయత",
    sec6_uncertaintiesTitle: "6. కీలక అనిశ్చితులు",
    sec7_recommendedActionsTitle: "7. సిఫార్సు చేసిన ఆచరణాత్మక చర్యలు",
    sec8_immediateChecksTitle: "8. వెంటనే పొలంలో తనిఖీ చేయవలసినవి",
    sec9_precautionsAvoidTitle: "9. ముఖ్యమైన జాగ్రత్తలు & చేయకూడని పనులు",
    sec10_monitoringTitle: "10. తరువాత గమనించవలసిన పరిస్థితులు",
    sec11_preventionTitle: "11. నివారణ మరియు భవిష్యత్ సంరక్షణ",
    sec12_expertHelpTitle: "12. వ్యవసాయ నిపుణులను ఎప్పుడు సంప్రదించాలి",
    sec13_limitationsTitle: "13. సమాచార పరిమితులు",

    reportedSymptomsLabel: "రైతు పేర్కొన్న సమస్య లక్షణాలు",
    whyFitsLabel: "ఈ కారణం ఎందుకు సరిపోతుంది",
    missingEvidenceLabel: "ధృవీకరించడానికి కావాల్సిన అదనపు సమాచారం",
    confidenceLevelLabel: "విశ్వసనీయత స్థాయి",
    obsVsInterpLabel: "శాస్త్రీయ విభజన (పరిశీలన vs వివరణ)",
    furtherTestingLabel: "తదుపరి నిర్ధారణ పరీక్షలు",
    expertOfficesLabel: "సిఫార్సు చేయబడిన వ్యవసాయ సంస్థలు",
    disclaimerLabel: "సలహా గమనిక",

    audioPlay: "నివేదికను వినండి",
    audioPause: "పాజ్ చేయండి",
    audioResume: "కొనసాగించండి",
    audioStop: "ఆడియో ఆపండి",
    audioSpeedLabel: "వేగం",
    audioNoVoiceNotice: "ఈ బ్రౌజర్‌లో సహజ తెలుగు వాయిస్ లేదు. మీరు పైన ఉన్న తెలుగు నివేదికను చదవవచ్చు లేదా ఇంగ్లీషుకు మార్చి ఆడియో వినవచ్చు.",

    printButton: "నివేదికను ప్రింట్ / సేవ్ చేయండి (PDF)",
    analyzeAnotherButton: "మరొక పంటను విశ్లేషించండి",
    startNewButton: "కొత్త సంప్రదింపు ప్రారంభించండి",
    n8nSettingsLabel: "n8n వర్క్‌ఫ్లో సెట్టింగ్‌లు",
    n8nEndpointPlaceholder: "https://your-n8n.instance/webhook/agripilot",
    n8nConnected: "n8n వెబ్‌హుక్ కనెక్ట్ చేయబడింది",
    n8nNotConnected: "అగ్రిపైలట్ AI ఇంజిన్ (Gemini 3.8 Flash) వాడుతోంది"
  }
};

