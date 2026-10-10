export type Language = 'en' | 'te';

export type GrowthStage = 
  | 'Seedling / నారు దశ'
  | 'Vegetative / శాఖీయ దశ'
  | 'Flowering / పూత దశ'
  | 'Fruiting / కాయ దశ'
  | 'Maturity & Harvest / కోత దశ'
  | 'Not Sure / తెలియదు';

export interface ImageData {
  data: string; // Base64 string without data:image/...;base64 prefix
  fullDataUrl: string;
  mimeType: string;
  filename: string;
  sizeBytes: number;
}

export interface AnalysisRequest {
  action: 'analyze_crop';
  farmerName?: string;
  email?: string;
  location?: string;
  crop?: string;
  growthStage?: string;
  problemDuration?: string;
  recentPractices?: string;
  language: Language;
  message: string;
  conversationId: string;
  image?: {
    data: string;
    mimeType: string;
    filename?: string;
    sizeBytes?: number;
  };
  n8nWebhookUrl?: string;
  useBuiltinAI?: boolean;
}

export interface PlausibleCause {
  cause: string;
  explanation: string;
  fittingEvidence: string;
  missingEvidence: string;
}

export interface ReportData {
  id: string;
  createdAt: string;
  language: Language;
  cropName?: string;
  farmerName?: string;
  location?: string;
  imageUrl?: string;
  
  // Section 1: Crop Problem Summary
  section1_summary: {
    farmerProblemSummary: string;
    visibleImageObservations: string[];
  };

  // Section 2: What May Have Happened
  section2_whatHappened: {
    possibleIssueOverview: string;
    visibleSigns: string[];
    observationsVsInterpretation: string;
  };

  // Section 3: Why It May Have Happened
  section3_whyHappened: {
    plausibleCauses: PlausibleCause[];
  };

  // Section 4: Assessment and Confidence
  section4_confidence: {
    confidenceLevel: 'High' | 'Moderate' | 'Tentative' | 'Low';
    confidenceExplanation: string;
    keyUncertainties: string[];
  };

  // Section 5: Recommended Actions (Numbered practical action plan)
  section5_recommendedActions: {
    immediateChecks: string[];
    culturalSteps: string[];
    monitoringConditions: string[];
    actionsToAvoid: string[];
    furtherTestingNotes: string;
  };

  // Section 6: Prevention and Future Care
  section6_prevention: {
    recommendations: string[];
  };

  // Section 7: When to Seek Expert Help
  section7_expertHelp: {
    contactThreshold: string;
    recommendedOffices: string[];
  };

  // Section 8: Sources and Limitations
  section8_limitations: {
    diagnosticLimitations: string[];
    unavailableInfo: string[];
    disclaimer: string;
    sourcesConsulted?: string[];
  };

  engineUsed?: 'n8n' | 'gemini';
}
