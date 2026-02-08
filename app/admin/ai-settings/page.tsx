'use client';

import 'antd/dist/reset.css';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useTheme } from '@/components/providers/AntdProvider';
import {
  Card,
  Typography,
  Button,
  Input,
  Space,
  Tabs,
  Select,
  Slider,
  InputNumber,
  Radio,
  Row,
  Col,
  Spin,
  message,
  Alert,
  Divider,
} from 'antd';
import {
  RobotOutlined,
  SearchOutlined,
  EditOutlined,
  FileTextOutlined,
  SaveOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AIConfig {
  gemini: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    topK: number;
  };
  webSearch: {
    model: string;
    maxTokens: number;
    temperature: number;
    searchDomainFilter: string[];
    searchRecencyFilter: string;
  };
  tone: {
    writingStyle: string;
    aggressiveness: string;
    customSystemInstruction?: string;
  };
  articleLength: {
    targetWordCount?: number;
    richSourceWords: string;
    moderateSourceWords: string;
    adequateSourceWords: string;
    limitedSourceWords: string;
  };
  seeding: {
    articlesPerCategory: number;
    webSearchArticles: number;
  };
}

const defaultConfig: AIConfig = {
  gemini: {
    model: 'gemini-2.0-flash',
    temperature: 0.1,
    maxTokens: 2800,
    topP: 0.8,
    topK: 20,
  },
  webSearch: {
    model: 'sonar',
    maxTokens: 1500,
    temperature: 0.1,
    searchDomainFilter: ['news'],
    searchRecencyFilter: 'week',
  },
  tone: {
    writingStyle: 'neutral',
    aggressiveness: 'neutral',
  },
  articleLength: {
    richSourceWords: '800-1200',
    moderateSourceWords: '600-900',
    adequateSourceWords: '500-750',
    limitedSourceWords: '400-600',
  },
  seeding: {
    articlesPerCategory: 6,
    webSearchArticles: 2,
  },
};

const DEFAULT_SYSTEM_INSTRUCTION =
  'You are a factual news writing assistant. You NEVER fabricate information. ' +
  'You ONLY write about facts explicitly stated in provided sources. ' +
  'You MUST attribute every claim to sources. If information is missing, ' +
  'you acknowledge gaps rather than inventing details. Accuracy is more important ' +
  'than article length. You follow AP style guidelines strictly.';

const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Default)' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Faster/Cheaper)' },
  { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash Preview (Latest)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Higher Quality)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Legacy)' },
];

const PERPLEXITY_MODELS = [
  { value: 'sonar', label: 'Sonar (Default - Fast)' },
  { value: 'sonar-pro', label: 'Sonar Pro (Higher Quality)' },
];

export default function AISettingsPage() {
  const { isDark } = useTheme();
  const [config, setConfig] = useState<AIConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, { configured: boolean; masked: string | null }>>({});
  const [savingKeys, setSavingKeys] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const API_KEY_DEFS = [
    { name: 'gemini', field: 'geminiApiKey', envVar: 'GEMINI_API_KEY', label: 'Gemini', description: 'Google AI - article generation, image generation, chat, fact-checking' },
    { name: 'openai', field: 'openaiApiKey', envVar: 'OPENAI_API_KEY', label: 'OpenAI', description: 'DALL-E banner generation, GPT fallback' },
    { name: 'pexels', field: 'pexelsApiKey', envVar: 'PEXELS_API_KEY', label: 'Pexels', description: 'Free stock photo search for article images' },
    { name: 'elevenlabs', field: 'elevenLabsApiKey', envVar: 'ELEVENLABS_API_KEY', label: 'ElevenLabs', description: 'Text-to-speech audio for articles' },
    { name: 'perplexity', field: 'perplexityApiKey', envVar: 'PERPLEXITY_API_KEY', label: 'Perplexity', description: 'Web search and real-time research' },
  ];

  useEffect(() => {
    loadConfig();
    loadKeyStatus();
  }, []);

  async function loadConfig() {
    try {
      const db = getDb();
      const snapshot = await getDoc(doc(db, 'settings', 'aiConfig'));
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConfig({
          gemini: { ...defaultConfig.gemini, ...data.gemini },
          webSearch: { ...defaultConfig.webSearch, ...data.webSearch },
          tone: { ...defaultConfig.tone, ...data.tone },
          articleLength: { ...defaultConfig.articleLength, ...data.articleLength },
          seeding: { ...defaultConfig.seeding, ...data.seeding },
        });
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
      message.error('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  }

  async function loadKeyStatus() {
    try {
      const db = getDb();
      const snapshot = await getDoc(doc(db, 'settings', 'apiKeys'));
      const data = snapshot.exists() ? snapshot.data() : {};
      const status: Record<string, { configured: boolean; masked: string | null }> = {};
      for (const { name, field } of API_KEY_DEFS) {
        const val = data[field];
        if (val && val.trim() !== '') {
          status[name] = { configured: true, masked: '••••••••' + val.slice(-4) };
        } else {
          status[name] = { configured: false, masked: null };
        }
      }
      setKeyStatus(status);
    } catch (error) {
      console.error('Failed to load API key status:', error);
    }
  }

  async function saveApiKeys() {
    const keysToSave: Record<string, string> = {};
    for (const { name, field } of API_KEY_DEFS) {
      const val = keyInputs[name];
      if (val && val.trim() !== '') {
        keysToSave[field] = val.trim();
      }
    }
    if (Object.keys(keysToSave).length === 0) {
      message.error('Enter at least one API key to save.');
      return;
    }
    setSavingKeys(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'apiKeys'), keysToSave, { merge: true });
      message.success(`${Object.keys(keysToSave).length} API key(s) saved successfully.`);
      setKeyInputs({});
      await loadKeyStatus();
    } catch (error) {
      console.error('Failed to save API keys:', error);
      message.error('Failed to save API keys.');
    } finally {
      setSavingKeys(false);
    }
  }

  async function testApiKey(name: string) {
    // Get the key to test - either newly entered or saved
    const db = getDb();
    let keyToTest = keyInputs[name]?.trim();
    if (!keyToTest) {
      const snapshot = await getDoc(doc(db, 'settings', 'apiKeys'));
      const data = snapshot.exists() ? snapshot.data() : {};
      const def = API_KEY_DEFS.find(d => d.name === name);
      keyToTest = def ? data[def.field] : undefined;
    }
    if (!keyToTest) {
      message.error(`No ${name} API key to test. Enter or save one first.`);
      return;
    }
    setTestingKey(name);
    try {
      let testUrl = '';
      let testOpts: RequestInit = {};
      if (name === 'gemini') {
        testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyToTest}`;
        testOpts = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Test' }] }], generationConfig: { maxOutputTokens: 5 } }),
        };
      } else if (name === 'openai') {
        testUrl = 'https://api.openai.com/v1/models';
        testOpts = { headers: { 'Authorization': `Bearer ${keyToTest}` } };
      } else if (name === 'pexels') {
        testUrl = 'https://api.pexels.com/v1/search?query=test&per_page=1';
        testOpts = { headers: { 'Authorization': keyToTest } };
      } else if (name === 'elevenlabs') {
        testUrl = 'https://api.elevenlabs.io/v1/voices';
        testOpts = { headers: { 'xi-api-key': keyToTest } };
      } else if (name === 'perplexity') {
        testUrl = 'https://api.perplexity.ai/chat/completions';
        testOpts = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToTest}` },
          body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'Test' }], max_tokens: 5 }),
        };
      }
      const response = await fetch(testUrl, testOpts);
      if (response.ok) {
        message.success(`${name} API key is valid!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(`${name} test failed: ${errorData.error?.message || response.statusText}`);
      }
    } catch (error: any) {
      message.error(`${name} test failed: ${error.message}`);
    } finally {
      setTestingKey(null);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'aiConfig'), {
        ...config,
        updatedAt: new Date(),
      });
      message.success('AI settings saved successfully');
    } catch (error) {
      console.error('Failed to save AI config:', error);
      message.error('Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  }

  function updateGemini(field: string, value: unknown) {
    setConfig(prev => ({
      ...prev,
      gemini: { ...prev.gemini, [field]: value },
    }));
  }

  function updateWebSearch(field: string, value: unknown) {
    setConfig(prev => ({
      ...prev,
      webSearch: { ...prev.webSearch, [field]: value },
    }));
  }

  function updateTone(field: string, value: unknown) {
    setConfig(prev => ({
      ...prev,
      tone: { ...prev.tone, [field]: value },
    }));
  }

  function updateArticleLength(field: string, value: unknown) {
    setConfig(prev => ({
      ...prev,
      articleLength: { ...prev.articleLength, [field]: value },
    }));
  }

  function updateSeeding(field: string, value: unknown) {
    setConfig(prev => ({
      ...prev,
      seeding: { ...prev.seeding, [field]: value },
    }));
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'keys',
      label: (
        <span>
          <KeyOutlined style={{ marginRight: 8 }} />
          API Keys
        </span>
      ),
      children: (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Manage API keys for all AI services. These keys are used by all tenant newspapers."
          />

          {API_KEY_DEFS.map(({ name, label, description }) => {
            const status = keyStatus[name];
            const hasInput = Boolean(keyInputs[name]?.trim());
            return (
              <div key={name}>
                <Row gutter={16} align="middle">
                  <Col span={4}>
                    <Text strong>{label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{description}</Text>
                  </Col>
                  <Col flex="auto">
                    <Input.Password
                      placeholder={status?.configured ? status.masked || 'Configured' : 'Enter API key...'}
                      value={keyInputs[name] || ''}
                      onChange={(e) => setKeyInputs(prev => ({ ...prev, [name]: e.target.value }))}
                      iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Col>
                  <Col>
                    {hasInput ? (
                      <Text type="warning" strong>New</Text>
                    ) : status?.configured ? (
                      <Text type="success"><CheckCircleOutlined /> Saved</Text>
                    ) : (
                      <Text type="danger"><CloseCircleOutlined /> Missing</Text>
                    )}
                  </Col>
                  <Col>
                    <Button
                      size="small"
                      onClick={() => testApiKey(name)}
                      loading={testingKey === name}
                    >
                      Test
                    </Button>
                  </Col>
                </Row>
              </div>
            );
          })}

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={savingKeys ? <LoadingOutlined /> : <SaveOutlined />}
              onClick={saveApiKeys}
              loading={savingKeys}
              disabled={Object.values(keyInputs).every(v => !v?.trim())}
              size="large"
            >
              Save API Keys
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'model',
      label: (
        <span>
          <RobotOutlined style={{ marginRight: 8 }} />
          Model Configuration
        </span>
      ),
      children: (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="These model settings control how all AI-generated content is produced across every newspaper."
          />

          <div>
            <Text strong>Language Model</Text>
            <div style={{ marginTop: 8 }}>
              <Select
                value={config.gemini.model}
                onChange={(v) => updateGemini('model', v)}
                options={GEMINI_MODELS}
                style={{ width: '100%', maxWidth: 500 }}
                size="large"
              />
            </div>
          </div>

          <div>
            <Text strong>Temperature</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Lower = more factual and consistent. Higher = more creative and varied.
            </Text>
            <Row gutter={16} align="middle">
              <Col flex="auto" style={{ maxWidth: 400 }}>
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={config.gemini.temperature}
                  onChange={(v) => updateGemini('temperature', v)}
                  marks={{ 0: 'Factual', 0.5: 'Balanced', 1: 'Creative', 2: 'Max' }}
                />
              </Col>
              <Col>
                <InputNumber
                  min={0}
                  max={2}
                  step={0.05}
                  value={config.gemini.temperature}
                  onChange={(v) => updateGemini('temperature', v ?? 0.1)}
                  style={{ width: 80 }}
                />
              </Col>
            </Row>
          </div>

          <Divider />

          <div>
            <Text strong>Max Output Tokens</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Maximum length of generated content. ~750 words per 1000 tokens.
            </Text>
            <InputNumber
              min={500}
              max={8000}
              step={100}
              value={config.gemini.maxTokens}
              onChange={(v) => updateGemini('maxTokens', v ?? 2800)}
              style={{ width: 200 }}
              addonAfter="tokens"
            />
          </div>

          <Row gutter={32}>
            <Col span={12}>
              <Text strong>Top P (Nucleus Sampling)</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Controls diversity. Lower = more focused. Default: 0.8
              </Text>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={config.gemini.topP}
                onChange={(v) => updateGemini('topP', v)}
                marks={{ 0: '0', 0.5: '0.5', 1: '1.0' }}
              />
            </Col>
            <Col span={12}>
              <Text strong>Top K</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Limits vocabulary choices. Lower = more predictable. Default: 20
              </Text>
              <InputNumber
                min={1}
                max={100}
                value={config.gemini.topK}
                onChange={(v) => updateGemini('topK', v ?? 20)}
                style={{ width: 120 }}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveConfig}
              loading={saving}
              size="large"
            >
              Save Model Settings
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'search',
      label: (
        <span>
          <SearchOutlined style={{ marginRight: 8 }} />
          Web Search
        </span>
      ),
      children: (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Controls how Perplexity searches the web for news sources before article generation."
          />

          <div>
            <Text strong>Search Model</Text>
            <div style={{ marginTop: 8 }}>
              <Select
                value={config.webSearch.model}
                onChange={(v) => updateWebSearch('model', v)}
                options={PERPLEXITY_MODELS}
                style={{ width: '100%', maxWidth: 400 }}
                size="large"
              />
            </div>
          </div>

          <Row gutter={32}>
            <Col span={12}>
              <Text strong>Max Tokens</Text>
              <div style={{ marginTop: 8 }}>
                <InputNumber
                  min={500}
                  max={4000}
                  step={100}
                  value={config.webSearch.maxTokens}
                  onChange={(v) => updateWebSearch('maxTokens', v ?? 1500)}
                  style={{ width: 200 }}
                />
              </div>
            </Col>
            <Col span={12}>
              <Text strong>Temperature</Text>
              <div style={{ marginTop: 8 }}>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.webSearch.temperature}
                  onChange={(v) => updateWebSearch('temperature', v ?? 0.1)}
                  style={{ width: 120 }}
                />
              </div>
            </Col>
          </Row>

          <div>
            <Text strong>Domain Filter</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Restrict searches to specific content types.
            </Text>
            <Select
              mode="tags"
              value={config.webSearch.searchDomainFilter}
              onChange={(v) => updateWebSearch('searchDomainFilter', v)}
              placeholder="Type to add domains..."
              style={{ width: '100%', maxWidth: 500 }}
              options={[
                { value: 'news', label: 'News' },
                { value: 'gov', label: 'Government (.gov)' },
                { value: 'edu', label: 'Education (.edu)' },
              ]}
            />
          </div>

          <div>
            <Text strong>Recency Filter</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              How recent should search results be?
            </Text>
            <Radio.Group
              value={config.webSearch.searchRecencyFilter}
              onChange={(e) => updateWebSearch('searchRecencyFilter', e.target.value)}
            >
              <Radio.Button value="day">Last 24 Hours</Radio.Button>
              <Radio.Button value="week">Last Week</Radio.Button>
              <Radio.Button value="month">Last Month</Radio.Button>
              <Radio.Button value="year">Last Year</Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveConfig}
              loading={saving}
              size="large"
            >
              Save Search Settings
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'tone',
      label: (
        <span>
          <EditOutlined style={{ marginRight: 8 }} />
          Tone & Style
        </span>
      ),
      children: (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Controls the writing voice and editorial approach for all generated articles."
          />

          <div>
            <Text strong>Writing Style</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Sets the overall voice for generated content.
            </Text>
            <Radio.Group
              value={config.tone.writingStyle}
              onChange={(e) => updateTone('writingStyle', e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="large"
            >
              <Radio.Button value="formal">Formal</Radio.Button>
              <Radio.Button value="neutral">Neutral</Radio.Button>
              <Radio.Button value="conversational">Conversational</Radio.Button>
              <Radio.Button value="investigative">Investigative</Radio.Button>
            </Radio.Group>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {config.tone.writingStyle === 'formal' && 'Professional, authoritative tone. Structured paragraphs, precise language, formal attributions.'}
                {config.tone.writingStyle === 'neutral' && 'Balanced, straightforward reporting. Clear language, standard news format.'}
                {config.tone.writingStyle === 'conversational' && 'Approachable, reader-friendly tone. Shorter sentences, relatable language.'}
                {config.tone.writingStyle === 'investigative' && 'Probing, detail-oriented approach. Questions assumptions, digs deeper into sources.'}
              </Text>
            </div>
          </div>

          <div>
            <Text strong>Aggressiveness</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              How bold or cautious the writing should be.
            </Text>
            <Radio.Group
              value={config.tone.aggressiveness}
              onChange={(e) => updateTone('aggressiveness', e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="large"
            >
              <Radio.Button value="conservative">Conservative</Radio.Button>
              <Radio.Button value="neutral">Neutral</Radio.Button>
              <Radio.Button value="aggressive">Aggressive</Radio.Button>
            </Radio.Group>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {config.tone.aggressiveness === 'conservative' && 'Measured, careful language. Avoids sensationalism. Prefers hedged statements over bold claims.'}
                {config.tone.aggressiveness === 'neutral' && 'Standard news approach. Balanced reporting without editorial lean.'}
                {config.tone.aggressiveness === 'aggressive' && 'Strong, assertive language. Punchy headlines. Leads with the most impactful angle.'}
              </Text>
            </div>
          </div>

          <Divider />

          <div>
            <Text strong>Custom System Instruction (Advanced)</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Override the default AI system prompt. Leave blank to use the default.
            </Text>
            <TextArea
              value={config.tone.customSystemInstruction || ''}
              onChange={(e) => updateTone('customSystemInstruction', e.target.value || undefined)}
              placeholder={DEFAULT_SYSTEM_INSTRUCTION}
              rows={5}
              style={{ maxWidth: 700 }}
            />
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Default: &quot;{DEFAULT_SYSTEM_INSTRUCTION.substring(0, 80)}...&quot;
              </Text>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveConfig}
              loading={saving}
              size="large"
            >
              Save Tone Settings
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'length',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          Article Length
        </span>
      ),
      children: (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Article length adapts to source material quality. These ranges control the target word counts for each quality tier."
          />

          <div>
            <Text strong>Target Word Count (Override)</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Set a fixed word count target. Leave empty to use dynamic ranges below.
            </Text>
            <InputNumber
              min={200}
              max={3000}
              step={50}
              value={config.articleLength.targetWordCount}
              onChange={(v) => updateArticleLength('targetWordCount', v || undefined)}
              placeholder="Auto (dynamic)"
              style={{ width: 200 }}
              addonAfter="words"
            />
          </div>

          <Divider>Dynamic Word Ranges by Source Quality</Divider>

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <Text strong>Rich Sources</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Multiple detailed sources available
              </Text>
              <Input
                value={config.articleLength.richSourceWords}
                onChange={(e) => updateArticleLength('richSourceWords', e.target.value)}
                placeholder="650-900"
                style={{ width: 200 }}
                addonAfter="words"
              />
            </Col>
            <Col span={12}>
              <Text strong>Moderate Sources</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Some good sources with partial detail
              </Text>
              <Input
                value={config.articleLength.moderateSourceWords}
                onChange={(e) => updateArticleLength('moderateSourceWords', e.target.value)}
                placeholder="520-715"
                style={{ width: 200 }}
                addonAfter="words"
              />
            </Col>
            <Col span={12}>
              <Text strong>Adequate Sources</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Limited sources, basic facts only
              </Text>
              <Input
                value={config.articleLength.adequateSourceWords}
                onChange={(e) => updateArticleLength('adequateSourceWords', e.target.value)}
                placeholder="390-585"
                style={{ width: 200 }}
                addonAfter="words"
              />
            </Col>
            <Col span={12}>
              <Text strong>Limited Sources</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Minimal source material available
              </Text>
              <Input
                value={config.articleLength.limitedSourceWords}
                onChange={(e) => updateArticleLength('limitedSourceWords', e.target.value)}
                placeholder="260-390"
                style={{ width: 200 }}
                addonAfter="words"
              />
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveConfig}
              loading={saving}
              size="large"
            >
              Save Length Settings
            </Button>
          </div>
        </Space>
      ),
    },
    {
      key: 'seeding',
      label: (
        <span>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          Seeding
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Controls how many articles are generated when a new newspaper is first created. Each category gets this many seed articles."
          />

          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <Text strong>Articles Per Category</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                How many articles to generate for each category during initial seeding.
                Total seed articles = this number x number of categories (usually 6).
              </Text>
              <InputNumber
                min={1}
                max={12}
                value={config.seeding.articlesPerCategory}
                onChange={(v) => updateSeeding('articlesPerCategory', v ?? 6)}
                style={{ width: 120 }}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                Current total: {config.seeding.articlesPerCategory * 6} articles (6 categories x {config.seeding.articlesPerCategory})
              </Text>
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Web Search Articles</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                How many articles per category use live web search for real news.
                The rest use AI local-interest mode for original content variety.
              </Text>
              <InputNumber
                min={0}
                max={config.seeding.articlesPerCategory}
                value={config.seeding.webSearchArticles}
                onChange={(v) => updateSeeding('webSearchArticles', v ?? 2)}
                style={{ width: 120 }}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                Per category: {config.seeding.webSearchArticles} web search + {config.seeding.articlesPerCategory - config.seeding.webSearchArticles} local interest
              </Text>
            </Col>
          </Row>

          <Divider />

          <Alert
            type="warning"
            showIcon
            message="Changing these settings only affects NEW newspapers created after saving. Existing papers are not affected."
          />

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveConfig}
              loading={saving}
              size="large"
            >
              Save Seeding Settings
            </Button>
          </div>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>AI Configuration</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Control AI model settings, tone, and article generation parameters for all newspapers.
      </Text>

      <Card>
        <Tabs items={tabItems} size="large" />
      </Card>
    </div>
  );
}
