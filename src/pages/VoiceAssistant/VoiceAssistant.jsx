import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getActiveCustomersApi, getCustomersApi } from "../../api/customers.api";
import { getActiveAnimalsApi, getAnimalsApi } from "../../api/animals.api";
import { getMonthlyBillsApi } from "../../api/bills.api";
import { createMilkDeliveryApi, getMilkDeliveriesApi } from "../../api/milkDelivery.api";
import { createMilkProductionApi, getMilkProductionByDateApi } from "../../api/milkProduction.api";
import { createPaymentApi } from "../../api/payments.api";
import "./voice-assistant.css";

const ROUTES = [
  { key: "dashboard", path: "/", terms: ["dashboard", "home", "मुख्य पृष्ठ", "डैशबोर्ड", "होम"] },
  { key: "customers", path: "/customers", terms: ["customer", "customers", "ग्राहक", "कस्टमर"] },
  { key: "animals", path: "/animals", terms: ["animal", "animals", "पशु", "जानवर", "गाय", "भैंस"] },
  { key: "production", path: "/milk-production", terms: ["production", "milk production", "उत्पादन", "दूध उत्पादन"] },
  { key: "delivery", path: "/milk-delivery", terms: ["delivery", "milk delivery", "डिलीवरी", "दूध वितरण", "दूध देना"] },
  { key: "bills", path: "/bills", terms: ["bill", "bills", "billing", "बिल", "हिसाब"] },
  { key: "payments", path: "/payments", terms: ["payment", "payments", "भुगतान", "पैसे जमा", "पेमेंट"] },
  { key: "reports", path: "/reports", terms: ["report", "reports", "रिपोर्ट"] },
];

const EXAMPLES = [
  "ग्राहक खोलो",
  "आज का दूध उत्पादन दिखाओ",
  "आज की डिलीवरी दिखाओ",
  "रामलाल का कितना पैसा बाकी है?",
  "रामलाल को दूध देना है",
  "रामलाल को आधा लीटर दूध सुबह देना है",
  "गाय 101 का सुबह 5 और शाम 4 लीटर उत्पादन दर्ज करो",
  "मोहन ने 500 रुपये नकद दिए",
];

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const liters = (value) => `${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} लीटर`;
const clean = (value) => String(value || "").toLocaleLowerCase("hi-IN").replace(/[?!.,।]/g, " ").replace(/\s+/g, " ").trim();

function parseNumber(text) {
  const normalized = clean(text);
  const fractionMap = [
    [/तीन चौथाई|पौने एक|three quarters|three quarter/, 0.75],
    [/आधा|आधे|अर्ध|half|half a/, 0.5],
    [/एक चौथाई|चौथाई|पाव|quarter|one quarter/, 0.25],
    [/डेढ़|डेढ|one and a half|one point five/, 1.5],
    [/ढाई|two and a half/, 2.5],
    [/सवा|one and a quarter/, 1.25],
    [/दो|दो लीटर|two/, 2],
    [/तीन|three/, 3],
    [/चार|four/, 4],
    [/पांच|पाँच|five/, 5],
    [/छह|छ:|six/, 6],
    [/सात|seven/, 7],
    [/आठ|eight/, 8],
    [/नौ|nine/, 9],
    [/दस|ten/, 10],
    [/एक|one|a liter|one liter/, 1],
  ];
  for (const [pattern, value] of fractionMap) if (pattern.test(normalized)) return value;
  const match = normalized.match(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/);
  return match ? Number(match[1]) : null;
}

function findNamedEntity(text, entities, getName) {
  const normalized = clean(text);
  const matches = [...(entities || [])].filter((entity) => {
    const name = clean(getName(entity));
    return name && normalized.includes(name);
  }).sort((a, b) => clean(getName(b)).length - clean(getName(a)).length);
  return matches[0] || null;
}

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [language, setLanguage] = useState(() => localStorage.getItem("dairy-app-language") || "hi");
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typedCommand, setTypedCommand] = useState("");
  const [reply, setReply] = useState("नमस्ते! मैं आपकी डेयरी में मदद के लिए तैयार हूँ। बोलें या नीचे कमांड लिखें।");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const confirmActionRef = useRef(null);
  const [conversationDraft, setConversationDraft] = useState(null);
  const [guidedDeliveryActive, setGuidedDeliveryActive] = useState(false);
  const [deliveryQueue, setDeliveryQueue] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");

  const hindi = language === "hi";

  useEffect(() => {
    const syncLanguage = (event) => setLanguage(event.detail || localStorage.getItem("dairy-app-language") || "hi");
    window.addEventListener("dairy-language-change", syncLanguage);
    return () => window.removeEventListener("dairy-language-change", syncLanguage);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(SpeechRecognition));
    if (!SpeechRecognition) return undefined;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setListening(true); setError(""); };
    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setTranscript(finalText || interim);
      if (finalText.trim()) {
        setTypedCommand(finalText.trim());
        window.setTimeout(() => handleCommandRef.current?.(finalText.trim()), 120);
      }
    };
    recognition.onerror = (event) => {
      setError(event.error === "not-allowed"
        ? "माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें या कमांड लिखें।"
        : "आवाज़ सुनने में समस्या हुई। दोबारा कोशिश करें या कमांड लिखें।");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.onend = null;
      try { recognition.stop(); } catch { /* already stopped */ }
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getActiveCustomersApi().catch(() => getCustomersApi()),
      getActiveAnimalsApi().catch(() => getAnimalsApi()),
    ]).then(([customerData, animalData]) => {
      if (!active) return;
      setCustomers(Array.isArray(customerData) ? customerData : customerData?.data || []);
      setAnimals(Array.isArray(animalData) ? animalData : animalData?.data || []);
      setLoaded(true);
    }).catch(() => {
      if (active) setError("ग्राहक और पशु सूची नहीं खुल सकी। लॉगिन और API कनेक्शन जाँचें।");
    });
    return () => { active = false; };
  }, []);

  const speak = useCallback((text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = hindi ? "hi-IN" : "en-IN";
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  }, [hindi]);

  const answer = useCallback((text, spoken = true) => {
    setReply(text);
    setHistory((items) => [{ id: Date.now(), command: transcript || typedCommand, reply: text }, ...items].slice(0, 5));
    if (spoken) speak(text);
  }, [speak, transcript, typedCommand]);

  const stageAction = useCallback((action, message) => {
    setPendingAction(action);
    answer(message);
  }, [answer]);

  const beginGuidedCustomer = useCallback((customer, remainingQueue) => {
    if (!customer) {
      setGuidedDeliveryActive(false);
      setDeliveryQueue([]);
      setConversationDraft(null);
      answer("आज की डिलीवरी सूची पूरी हो गई। कोई और ग्राहक दर्ज करना हो तो नई डिलीवरी राउंड शुरू करें।");
      return;
    }
    const scheduledMorning = Number(customer.morning || 0);
    const scheduledEvening = Number(customer.evening || 0);
    // Follow the schedule configured on the customer record. If no schedule is
    // configured, ask for both periods so the round never silently skips evening.
    const periods = [
      ...(scheduledMorning > 0 ? ["morning"] : []),
      ...(scheduledEvening > 0 ? ["evening"] : []),
    ];
    if (periods.length === 0) periods.push("morning", "evening");
    const draft = {
      type: "delivery",
      customerId: customer._id || customer.id,
      customerName: customer.name || customer.customerName || "ग्राहक",
      guided: true,
      periods,
      step: periods[0],
      morning: null,
      evening: null,
    };
    setDeliveryQueue(remainingQueue);
    setConversationDraft(draft);
    answer(`${draft.customerName} की ${periods[0] === "morning" ? "सुबह" : "शाम"} की डिलीवरी कितनी है? मात्रा बोलें, या दूध नहीं देना हो तो शून्य बोलें।`);
  }, [answer]);

  const startGuidedDelivery = useCallback(() => {
    if (!customers.length) {
      answer("ग्राहक सूची खाली है या अभी लोड नहीं हुई। पहले ग्राहक पेज पर सक्रिय ग्राहक जोड़ें।");
      return;
    }
    const queue = [...customers].filter((customer) => customer && (customer._id || customer.id));
    setGuidedDeliveryActive(true);
    beginGuidedCustomer(queue[0], queue.slice(1));
  }, [answer, beginGuidedCustomer, customers]);

  const skipGuidedCustomer = useCallback(() => {
    if (!guidedDeliveryActive) return;
    const [next, ...remaining] = deliveryQueue;
    setConversationDraft(null);
    beginGuidedCustomer(next, remaining);
  }, [beginGuidedCustomer, deliveryQueue, guidedDeliveryActive]);

  const processCommand = useCallback(async (rawText) => {
    const text = clean(rawText);
    if (!text) return;
    setTranscript(rawText);
    // Approve/cancel a staged write with either speech or typed text.
    if (pendingAction && /^(हाँ|हां|जी हाँ|जी हां|हाँ सेव करो|सेव करो|पक्का|yes|confirm|save|कर दो|ठीक है)$/i.test(text)) {
      await confirmActionRef.current?.();
      return;
    }
    if (pendingAction && /^(नहीं|नही|रद्द|रद्द करो|कैंसल|cancel|no|मत करो|सेव मत करो)$/i.test(text)) {
      setPendingAction(null);
      if (guidedDeliveryActive && pendingAction.type === "delivery") {
        const [next, ...remaining] = deliveryQueue;
        answer("यह रिकॉर्ड सेव नहीं किया गया। अब अगले ग्राहक पर चलते हैं।", false);
        window.setTimeout(() => beginGuidedCustomer(next, remaining), 350);
      } else {
        answer("ठीक है, रिकॉर्ड सेव नहीं किया गया।");
      }
      return;
    }
    if (conversationDraft && /^(नहीं|नही|रद्द|रद्द करो|कैंसल|cancel|no|मत करो)$/i.test(text)) {
      setConversationDraft(null);
      setGuidedDeliveryActive(false);
      setDeliveryQueue([]);
      answer("ठीक है, बातचीत रद्द कर दी। कोई रिकॉर्ड सेव नहीं हुआ।");
      return;
    }
    // Guided round: collect each configured period separately, then confirm once.
    if (conversationDraft?.type === "delivery" && conversationDraft.guided) {
      const noMilk = /^(नहीं|नही|नहीं देना|दूध नहीं|नहीं चाहिए|शून्य|जीरो|zero|none|no milk|0|0 लीटर)$/.test(text);
      const amountHasSignal = noMilk || /\d|आधा|आधे|अर्ध|चौथाई|पाव|पौने|तीन चौथाई|डेढ़|डेढ|ढाई|सवा|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|half|quarter|one|two|three|four|five|six|seven|eight|nine|ten/.test(text);
      const amount = noMilk ? 0 : (amountHasSignal ? parseNumber(text) : null);
      if (amount === null || amount < 0 || amount > 10) {
        const periodLabel = conversationDraft.step === "evening" ? "शाम" : "सुबह";
        answer(`${conversationDraft.customerName} की ${periodLabel} की मात्रा साफ बोलें, जैसे आधा लीटर, 1 लीटर या शून्य।`);
        return;
      }
      const draft = { ...conversationDraft, [conversationDraft.step]: amount };
      const currentIndex = draft.periods.indexOf(conversationDraft.step);
      const nextPeriod = draft.periods[currentIndex + 1];
      if (nextPeriod) {
        draft.step = nextPeriod;
        setConversationDraft(draft);
        answer(`${draft.customerName} की ${nextPeriod === "morning" ? "सुबह" : "शाम"} की डिलीवरी कितनी है? मात्रा बोलें, या दूध नहीं देना हो तो शून्य बोलें।`);
        return;
      }
      const morning = Number(draft.morning || 0);
      const evening = Number(draft.evening || 0);
      const action = {
        type: "delivery", customerId: draft.customerId, customerName: draft.customerName,
        date: todayISO(), morning, evening,
        summary: `${draft.customerName} की डिलीवरी: सुबह ${liters(morning)}, शाम ${liters(evening)}`,
      };
      setConversationDraft(null);
      stageAction(action, `${action.summary} दर्ज करनी है। क्या मैं इसे सेव कर दूँ?`);
      return;
    }

    // Continue an incomplete single-customer delivery command with the farmer's next answer.
    if (conversationDraft?.type === "delivery") {
      const matchedCustomer = findNamedEntity(text, customers, (item) => item.name);
      const customer = matchedCustomer || customers.find((item) => String(item._id || item.id) === String(conversationDraft.customerId));
      const amountHasSignal = /\d|आधा|आधे|अर्ध|चौथाई|पाव|पौने|तीन चौथाई|डेढ़|डेढ|ढाई|सवा|\b(?:half|quarter|one|two|three|four|five|six|seven|eight|nine|ten)\b|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस/.test(text);
      const parsedAmount = amountHasSignal ? parseNumber(text) : null;
      const period = /(सुबह|morning)/.test(text) ? "morning" : /(शाम|evening)/.test(text) ? "evening" : conversationDraft.period;
      const draft = {
        ...conversationDraft,
        customerId: customer?._id || customer?.id || conversationDraft.customerId,
        customerName: customer?.name || conversationDraft.customerName,
        amount: parsedAmount !== null ? parsedAmount : conversationDraft.amount,
        period,
      };
      setConversationDraft(draft);
      if (!draft.customerId) { answer("किस ग्राहक को दूध देना है? ग्राहक का नाम बोलें या लिखें।"); return; }
      if (draft.amount === null || draft.amount === undefined || draft.amount <= 0 || draft.amount > 10) { answer(`${draft.customerName} को कितना दूध देना है? जैसे आधा लीटर या 1 लीटर।`); return; }
      if (!draft.period) { answer(`${draft.customerName} को ${liters(draft.amount)} दूध सुबह देना है या शाम को?`); return; }
      const action = {
        type: "delivery", customerId: draft.customerId, customerName: draft.customerName,
        date: todayISO(), morning: draft.period === "morning" ? draft.amount : 0,
        evening: draft.period === "evening" ? draft.amount : 0,
        summary: `${draft.customerName} को ${liters(draft.amount)} ${draft.period === "evening" ? "शाम" : "सुबह"} की डिलीवरी`,
      };
      setConversationDraft(null);
      stageAction(action, `${action.summary} दर्ज करनी है। क्या मैं इसे सेव कर दूँ?`);
      return;
    }
    setBusy(true);
    setError("");
    setPendingAction(null);
    try {
      const route = ROUTES.find((item) => item.terms.some((term) => text.includes(clean(term))) &&
        /(खोल|दिखा|जाओ|open|show|go to|खोलो|देखना|देखो|page|पेज)/.test(text));
      if (route) {
        navigate(route.path);
        answer(`${route.key === "dashboard" ? "मुख्य पृष्ठ" : route.key === "customers" ? "ग्राहक" : route.key === "animals" ? "पशु" : route.key === "production" ? "दूध उत्पादन" : route.key === "delivery" ? "दूध वितरण" : route.key === "bills" ? "बिल और हिसाब" : route.key === "payments" ? "भुगतान" : "रिपोर्ट"} पेज खोल दिया है।`);
        return;
      }

      if (/(आज की डिलीवरी|आज का डिलीवरी|show.*deliver|delivery.*today|डिलीवरी दिख|दूध वितरण दिख)/.test(text)) {
        const rows = await getMilkDeliveriesApi({ date: todayISO() });
        const total = (Array.isArray(rows) ? rows : []).reduce((sum, row) => sum + Number(row.totalLiters || Number(row.morning || 0) + Number(row.evening || 0)), 0);
        answer(`आज ${Array.isArray(rows) ? rows.length : 0} डिलीवरी दर्ज हैं। कुल ${liters(total)} दूध वितरित हुआ।`);
        return;
      }

      if (/(उत्पादन दिख|दूध उत्पादन दिख|production.*today|today.*production|आज का दूध|आज का उत्पादन)/.test(text)) {
        const rows = await getMilkProductionByDateApi(todayISO());
        const total = (Array.isArray(rows) ? rows : []).reduce((sum, row) => sum + Number(row.totalLiters || Number(row.morning || 0) + Number(row.evening || 0)), 0);
        answer(`आज ${Array.isArray(rows) ? rows.length : 0} पशुओं का उत्पादन दर्ज है। कुल ${liters(total)} दूध हुआ।`);
        return;
      }

      if (/(कितना पैसा बाकी|कितना बाकी|बकाया|pending|balance|बाकी राशि)/.test(text)) {
        const customer = findNamedEntity(text, customers, (item) => item.name);
        if (!customer) {
          answer("किस ग्राहक का बकाया जानना है? ग्राहक का पूरा नाम बोलें या लिखें।");
          return;
        }
        const now = new Date();
        const data = await getMonthlyBillsApi(now.getFullYear(), now.getMonth() + 1);
        const row = (data?.customers || []).find((item) => String(item.customer?._id || item.customerId) === String(customer._id || customer.id));
        if (!row) {
          answer(`${customer.name} का इस महीने का बिल रिकॉर्ड नहीं मिला। पहले बिल पेज में बिल जाँचें।`);
          return;
        }
        answer(`${customer.name} का बाकी पैसा ${money(row.pendingAmount)} है। ${row.generated ? `बिल राशि ${money(row.totalAmount)} और जमा ${money(row.paidAmount)} है।` : "इस महीने का बिल अभी बना नहीं है।"}`);
        return;
      }

      const deliveryIntent = /(डिलीवरी|दूध देना|दूध दे|deliver|delivery|लीटर.*को|को.*लीटर)/.test(text) &&
        /(को|देना|दें|deliver|delivery)/.test(text);
      if (deliveryIntent) {
        const customer = findNamedEntity(text, customers, (item) => item.name);
        const amount = parseNumber(text);
        const amountHasSignal = /\d|आधा|आधे|अर्ध|चौथाई|पाव|पौने|तीन चौथाई|डेढ़|डेढ|ढाई|सवा|\b(?:half|quarter|one|two|three|four|five|six|seven|eight|nine|ten)\b|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस/.test(text);
        const period = /(सुबह|morning)/.test(text) ? "morning" : /(शाम|evening)/.test(text) ? "evening" : null;
        const draft = {
          type: "delivery", customerId: customer?._id || customer?.id || null,
          customerName: customer?.name || null,
          amount: amountHasSignal ? amount : null, period,
        };
        setConversationDraft(draft);
        if (!draft.customerId) { answer("किस ग्राहक को दूध देना है? ग्राहक का नाम बोलें या लिखें।"); return; }
        if (draft.amount === null || draft.amount <= 0 || draft.amount > 10) { answer(`${draft.customerName} को कितना दूध देना है? जैसे आधा लीटर या 1 लीटर।`); return; }
        if (!draft.period) { answer(`${draft.customerName} को ${liters(draft.amount)} दूध सुबह देना है या शाम को?`); return; }
        setConversationDraft(null);
        const action = {
          type: "delivery", customerId: draft.customerId, customerName: draft.customerName,
          date: todayISO(), morning: draft.period === "morning" ? draft.amount : 0,
          evening: draft.period === "evening" ? draft.amount : 0,
          summary: `${draft.customerName} को ${liters(draft.amount)} ${draft.period === "evening" ? "शाम" : "सुबह"} की डिलीवरी`,
        };
        stageAction(action, `${action.summary} दर्ज करनी है। क्या मैं इसे सेव कर दूँ?`);
        return;
      }

      const productionIntent = /(उत्पादन दर्ज|production.*record|दूध हुआ|दूध निकला|लीटर उत्पादन|उत्पादन सेव)/.test(text);
      if (productionIntent) {
        const animal = findNamedEntity(text, animals, (item) => `${item.name || ""} ${item.tagNumber || ""}`);
        if (!animal) { answer("किस पशु का उत्पादन दर्ज करना है? पशु का नाम या टैग नंबर बोलें।"); return; }
        const morningMatch = text.match(/(?:सुबह|morning)\s*(\d+(?:\.\d+)?|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s*(?:लीटर|liter)?/);
        const eveningMatch = text.match(/(?:शाम|evening)\s*(\d+(?:\.\d+)?|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s*(?:लीटर|liter)?/);
        const morning = morningMatch ? parseNumber(morningMatch[1]) : 0;
        const evening = eveningMatch ? parseNumber(eveningMatch[1]) : 0;
        if (morning === null || evening === null || (morning === 0 && evening === 0)) {
          answer("सुबह और शाम की मात्रा साफ बोलें। उदाहरण: गाय 101 का सुबह 5 और शाम 4 लीटर उत्पादन दर्ज करो।");
          return;
        }
        const action = {
          type: "production",
          animalId: animal._id || animal.id,
          animalName: animal.name || animal.tagNumber,
          date: todayISO(),
          morning,
          evening,
          summary: `${animal.name || animal.tagNumber} का उत्पादन: सुबह ${liters(morning)}, शाम ${liters(evening)}`,
        };
        stageAction(action, `${action.summary} सेव करना है। क्या मैं इसे सेव कर दूँ?`);
        return;
      }

      const paymentIntent = /(पैसे दिए|रुपये दिए|रुपए दिए|payment|जमा करो|पेमेंट|नकद दिए|upi से)/.test(text);
      if (paymentIntent) {
        const customer = findNamedEntity(text, customers, (item) => item.name);
        const amount = parseNumber(text);
        if (!customer) { answer("किस ग्राहक ने पैसे दिए? ग्राहक का नाम बोलें।"); return; }
        if (amount === null || amount <= 0) { answer("कितने रुपये जमा हुए? उदाहरण: मोहन ने 500 रुपये नकद दिए।"); return; }
        const now = new Date();
        const bills = await getMonthlyBillsApi(now.getFullYear(), now.getMonth() + 1);
        const bill = (bills?.customers || []).find((item) =>
          String(item.customer?._id || item.customerId) === String(customer._id || customer.id) && item.generated && item.billId
        );
        if (!bill) { answer(`${customer.name} का इस महीने का बना हुआ बिल नहीं मिला। भुगतान दर्ज करने से पहले बिल बनाएँ।`); return; }
        const method = /upi|यूपीआई|फोनपे|phonepe|gpay|गूगल पे/.test(text) ? "UPI" : /bank|बैंक/.test(text) ? "BANK" : "CASH";
        const action = {
          type: "payment",
          customerId: customer._id || customer.id,
          customerName: customer.name,
          billId: bill.billId,
          amount,
          paymentDate: todayISO(),
          paymentMethod: method,
          summary: `${customer.name} से ${money(amount)} ${method === "CASH" ? "नकद" : method === "UPI" ? "UPI" : "बैंक"} भुगतान दर्ज करना`,
        };
        stageAction(action, `${action.summary} है। क्या मैं इसे सेव कर दूँ?`);
        return;
      }

      if (/(मदद|help|क्या कर सकते|commands|कमांड)/.test(text)) {
        answer("मैं पेज खोल सकता हूँ, आज का दूध उत्पादन और डिलीवरी बता सकता हूँ, ग्राहक का बकाया बता सकता हूँ, और पुष्टि के बाद डिलीवरी, उत्पादन या भुगतान दर्ज कर सकता हूँ। सेव करने के लिए हाँ सेव करो बोलें, रोकने के लिए रद्द करो बोलें। उदाहरण नीचे दिए हैं।");
        return;
      }

      answer("मैं यह कमांड पूरी तरह समझ नहीं पाया। ग्राहक खोलो, आज की डिलीवरी दिखाओ, या कहें: रामलाल को दूध देना है — मैं बाकी जानकारी पूछ लूँगा।");
    } catch (err) {
      const message = err?.response?.data?.message;
      answer(Array.isArray(message) ? message.join("। ") : message || "डेटा प्राप्त नहीं हुआ। लॉगिन, इंटरनेट और backend API कनेक्शन जाँचें।");
    } finally {
      setBusy(false);
    }
  }, [animals, answer, beginGuidedCustomer, customers, conversationDraft, deliveryQueue, guidedDeliveryActive, navigate, pendingAction, stageAction]);

  const handleCommandRef = useRef(processCommand);
  useEffect(() => { handleCommandRef.current = processCommand; }, [processCommand]);

  const startListening = () => {
    setError("");
    setTranscript("");
    if (!recognitionRef.current) {
      setError("इस ब्राउज़र में voice recognition उपलब्ध नहीं है। नीचे कमांड लिखकर इस्तेमाल करें।");
      return;
    }
    try {
      recognitionRef.current.lang = hindi ? "hi-IN" : "en-IN";
      recognitionRef.current.start();
    } catch {
      setError("माइक्रोफ़ोन पहले से चालू है। कुछ सेकंड बाद फिर कोशिश करें।");
    }
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setBusy(true);
    setError("");
    try {
      if (pendingAction.type === "delivery") {
        await createMilkDeliveryApi({
          customerId: pendingAction.customerId,
          date: pendingAction.date,
          morning: pendingAction.morning,
          evening: pendingAction.evening,
        });
        if (guidedDeliveryActive) {
          answer(`${pendingAction.customerName} की डिलीवरी सेव हो गई।`);
        } else {
          answer("डिलीवरी सफलतापूर्वक सेव हो गई।");
        }
      } else if (pendingAction.type === "production") {
        await createMilkProductionApi({
          animalId: pendingAction.animalId,
          date: pendingAction.date,
          morning: pendingAction.morning,
          evening: pendingAction.evening,
          note: "Voice assistant द्वारा दर्ज",
        });
        answer("दूध उत्पादन सफलतापूर्वक सेव हो गया।");
      } else if (pendingAction.type === "payment") {
        await createPaymentApi({
          customerId: pendingAction.customerId,
          billId: pendingAction.billId,
          amount: pendingAction.amount,
          paymentDate: pendingAction.paymentDate,
          paymentMethod: pendingAction.paymentMethod,
          note: "Voice assistant द्वारा दर्ज",
        });
        answer("भुगतान सफलतापूर्वक सेव हो गया।");
      }
      setPendingAction(null);
      if (pendingAction.type === "delivery" && guidedDeliveryActive) {
        const [next, ...remaining] = deliveryQueue;
        window.setTimeout(() => beginGuidedCustomer(next, remaining), 450);
      }
    } catch (err) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join("। ") : message || "रिकॉर्ड सेव नहीं हुआ। जानकारी जाँचकर दोबारा कोशिश करें।");
      speak("रिकॉर्ड सेव नहीं हुआ। कृपया जानकारी जाँचें।");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { confirmActionRef.current = confirmAction; }, [confirmAction]);

  const currentStatus = useMemo(() => {
    if (busy) return "जानकारी तैयार हो रही है…";
    if (listening) return "मैं सुन रहा हूँ…";
    if (pendingAction) return "आपकी पुष्टि का इंतज़ार है";
    if (conversationDraft) return "आपके जवाब का इंतज़ार है…";
    return "बोलने के लिए माइक्रोफ़ोन दबाएँ";
  }, [busy, listening, pendingAction, conversationDraft]);

  return (
    <div className="voice-page">
      <section className="voice-hero">
        <div className="voice-hero-copy">
          <span className="voice-eyebrow">अपनी डेयरी • VOICE ASSISTANT</span>
          <h1>बोलकर चलाएँ अपनी डेयरी</h1>
          <p>हिंदी में बोलें। दूध, डिलीवरी, ग्राहक का बकाया और भुगतान — सब कुछ आसान तरीके से संभालें।</p>
          <div className="voice-hero-tags">
            <span>🎙️ हाथों से मुक्त</span><span>🌿 हिंदी में</span><span>🔒 सेव करने से पहले पुष्टि</span>
          </div>
        </div>
        <div className="voice-cow-illustration" aria-hidden="true">🐄</div>
      </section>

      <Row className="g-4">
        <Col xl={7}>
          <Card className="voice-console h-100">
            <Card.Body>
              <div className="voice-console-top">
                <div>
                  <div className="voice-kicker">VOICE CONTROL</div>
                  <h2>आप क्या करना चाहते हैं?</h2>
                  <p>अपनी भाषा में बोलें या कमांड टाइप करें।</p>
                </div>
                <Badge bg={supported ? "success" : "warning"}>{supported ? "माइक उपलब्ध" : "टेक्स्ट मोड"}</Badge>
              </div>
              <div className="guided-delivery-panel">
                <div className="guided-delivery-heading">
                  <div>
                    <strong>ग्राहक सूची से डिलीवरी दर्ज करें</strong>
                    <small>सहायक हर ग्राहक से मात्रा और समय पूछेगा। सेव करने से पहले पुष्टि होगी।</small>
                  </div>
                  <Button size="sm" variant="success" onClick={startGuidedDelivery} disabled={!loaded || busy || guidedDeliveryActive || customers.length === 0}>
                    {guidedDeliveryActive ? "राउंड चल रही है" : "डिलीवरी राउंड शुरू करें"}
                  </Button>
                </div>
                <Form.Control
                  className="guided-customer-search"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="ग्राहक का नाम खोजें…"
                  aria-label="ग्राहक का नाम खोजें"
                />
                <div className="guided-customer-list">
                  {customers.filter((customer) => clean(customer.name || customer.customerName).includes(clean(customerSearch))).slice(0, 8).map((customer) => (
                    <button
                      type="button"
                      key={customer._id || customer.id || customer.name}
                      className="guided-customer-chip"
                      disabled={busy || Boolean(pendingAction) || guidedDeliveryActive}
                      onClick={() => {
                        setGuidedDeliveryActive(true);
                        beginGuidedCustomer(customer, []);
                      }}
                    >
                      <span className="guided-customer-avatar">{String(customer.name || customer.customerName || "ग").trim().charAt(0)}</span>
                      <span>{customer.name || customer.customerName || "नाम नहीं मिला"}</span>
                    </button>
                  ))}
                  {customers.length === 0 && <small>ग्राहक सूची लोड होने पर यहाँ दिखाई देगी।</small>}
                </div>
                {guidedDeliveryActive && conversationDraft?.guided && (
                  <div className="guided-delivery-progress">
                    <span>बाकी ग्राहक: {deliveryQueue.length + (conversationDraft ? 1 : 0)}</span>
                    <Button size="sm" variant="outline-secondary" onClick={skipGuidedCustomer} disabled={busy || Boolean(pendingAction)}>इस ग्राहक को छोड़ें</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => { setGuidedDeliveryActive(false); setDeliveryQueue([]); setConversationDraft(null); answer("डिलीवरी राउंड रोक दी गई। पहले से सेव रिकॉर्ड सुरक्षित हैं।"); }} disabled={busy}>राउंड रोकें</Button>
                  </div>
                )}
              </div>
              <div className={`voice-orb-wrap ${listening ? "is-listening" : ""}`}>
                <div className="voice-orb-ring ring-one" />
                <div className="voice-orb-ring ring-two" />
                <button type="button" className="voice-orb" onClick={listening ? stopListening : startListening} disabled={busy} aria-label={listening ? "आवाज़ सुनना बंद करें" : "आवाज़ से कमांड दें"}>
                  {busy ? <Spinner animation="border" /> : <span>{listening ? "■" : "🎙"}</span>}
                </button>
                <div className="voice-status">{currentStatus}</div>
                <div className="voice-substatus">{supported ? "Hindi speech recognition" : "आपके ब्राउज़र में माइक सपोर्ट नहीं मिला"}</div>
              </div>
              <div className="voice-transcript">
                <div className="voice-field-label">आपकी कमांड</div>
                <div className="voice-transcript-text">{transcript || "आपकी आवाज़ या लिखी हुई कमांड यहाँ दिखेगी…"}</div>
              </div>
              <Form onSubmit={(event) => { event.preventDefault(); if (typedCommand.trim()) processCommand(typedCommand.trim()); }}>
                <Form.Label>कमांड लिखें</Form.Label>
                <div className="voice-input-row">
                  <Form.Control value={typedCommand} onChange={(event) => setTypedCommand(event.target.value)} placeholder="जैसे: आज की डिलीवरी दिखाओ" />
                  <Button type="submit" disabled={busy || !typedCommand.trim()}>चलाएँ <span aria-hidden="true">→</span></Button>
                </div>
              </Form>
              {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
              <div className="voice-reply">
                <div className="voice-reply-icon">✦</div>
                <div className="flex-grow-1">
                  <div className="voice-field-label">सहायक का जवाब</div>
                  <div className="voice-reply-text">{reply}</div>
                </div>
                <Button variant="light" className="voice-speak-button" onClick={() => speak(reply)} title="जवाब फिर सुनें">🔊</Button>
              </div>
              {conversationDraft && (
                <Alert variant="info" className="mt-3 mb-0">
                  बातचीत जारी है। अपना जवाब बोलें या ऊपर लिखें। रद्द करने के लिए “रद्द करो” कहें।
                </Alert>
              )}
              {pendingAction && (
                <div className="voice-confirm-box">
                  <div className="voice-confirm-heading"><span>✓</span><div><strong>सेव करने से पहले जाँचें</strong><small>आपकी अनुमति के बिना रिकॉर्ड सेव नहीं होगा।</small></div></div>
                  <div className="voice-confirm-summary">{pendingAction.summary}</div>
                  <div className="voice-confirm-meta">तारीख: {pendingAction.date || pendingAction.paymentDate}</div>
                  <div className="voice-confirm-meta">बोलें: “हाँ सेव करो” या “रद्द करो” — या नीचे बटन दबाएँ।</div>
                  <div className="voice-confirm-actions">
                    <Button variant="success" onClick={confirmAction} disabled={busy}>हाँ, सेव करें</Button>
                    <Button variant="outline-secondary" onClick={() => {
                      setPendingAction(null);
                      if (guidedDeliveryActive && pendingAction.type === "delivery") {
                        const [next, ...remaining] = deliveryQueue;
                        answer("यह रिकॉर्ड सेव नहीं किया गया। अब अगले ग्राहक पर चलते हैं।", false);
                        window.setTimeout(() => beginGuidedCustomer(next, remaining), 350);
                      } else answer("ठीक है, रिकॉर्ड सेव नहीं किया गया।");
                    }} disabled={busy}>रद्द करें</Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xl={5}>
          <Card className="voice-examples-card mb-4">
            <Card.Body>
              <div className="voice-card-heading"><div><span className="voice-kicker">TRY SAYING</span><h3>इन कमांड से शुरू करें</h3></div><span className="voice-sparkle">✧</span></div>
              <div className="voice-example-list">
                {EXAMPLES.map((example, index) => (
                  <button key={example} type="button" className="voice-example" onClick={() => { setTypedCommand(example); setTranscript(example); processCommand(example); }}>
                    <span className="voice-example-number">{String(index + 1).padStart(2, "0")}</span>
                    <span>{example}</span><span className="voice-example-arrow">↗</span>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
          <Card className="voice-history-card">
            <Card.Body>
              <div className="voice-card-heading"><div><span className="voice-kicker">RECENT ACTIVITY</span><h3>हाल की बातचीत</h3></div><span className="voice-history-icon">◷</span></div>
              {history.length === 0 ? (
                <div className="voice-empty-history"><span>💬</span><p>आपकी कमांड यहाँ दिखेंगी। शुरुआत करने के लिए माइक्रोफ़ोन दबाएँ।</p></div>
              ) : history.map((item) => (
                <div className="voice-history-item" key={item.id}>
                  <span className="voice-history-dot" />
                  <div><div className="voice-history-command">{item.command || "Voice command"}</div><div className="voice-history-reply">{item.reply}</div></div>
                </div>
              ))}
            </Card.Body>
          </Card>
          <div className="voice-privacy-note"><span>🔐</span><span>आवाज़ को टेक्स्ट में बदलने के लिए ब्राउज़र का speech feature उपयोग होता है। रिकॉर्ड सेव करने से पहले आपकी पुष्टि ज़रूरी है।</span></div>
        </Col>
      </Row>
      {!loaded && <div className="voice-loading-note"><Spinner size="sm" animation="border" /> ग्राहक और पशु सूची लोड हो रही है…</div>}
    </div>
  );
}
