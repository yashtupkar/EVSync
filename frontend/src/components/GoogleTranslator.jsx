import React, { useState, useEffect } from 'react';
import { Languages, ChevronDown, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { name: 'English', code: 'en', flag: '/assets/flags/united-states.png' },
  { name: 'हिन्दी', code: 'hi', flag: '/assets/flags/flag.png' },
  { name: 'मराठी', code: 'mr', flag: '/assets/flags/flag.png' },
  { name: 'ગુજરાતી', code: 'gu', flag: '/assets/flags/flag.png' },
  { name: 'தமிழ்', code: 'ta', flag: '/assets/flags/flag.png' },
  { name: 'తెలుగు', code: 'te', flag: '/assets/flags/flag.png' },
  { name: 'ಕನ್ನಡ', code: 'kn', flag: '/assets/flags/flag.png' },
  { name: 'മലയാളം', code: 'ml', flag: '/assets/flags/flag.png' },
  { name: 'বাংলা', code: 'bn', flag: '/assets/flags/flag.png' },
  { name: 'ਪੰਜਾਬੀ', code: 'pa', flag: '/assets/flags/flag.png' },
  { name: 'اردو', code: 'ur', flag: '/assets/flags/flag.png' },
];

const GoogleTranslator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // 1. Check localStorage first (more reliable for UI state)
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang) {
      setCurrentLang(savedLang);
      return;
    }

    // 2. Fallback to google translate cookie
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const val = parts.pop().split(';').shift();
        // Remove quotes if present
        return val.replace(/^"|"$/g, '');
      }
    };

    const googTrans = getCookie('googtrans');
    if (googTrans) {
      const lang = googTrans.split('/').pop();
      if (lang && lang.length <= 5) { // Basic validation
        setCurrentLang(lang);
        localStorage.setItem('userLanguage', lang);
      }
    }
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    setIsOpen(false);
    localStorage.setItem('userLanguage', langCode);

    // Google Translate works by setting a cookie 'googtrans'
    // Format: /en/hi (from English to Hindi)
    const cookieValue = `/en/${langCode}`;
    
    // Set cookie for current domain and root path
    document.cookie = `googtrans=${cookieValue}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
    
    // Also try setting it for the base domain to ensure it's picked up
    const domain = window.location.hostname.split('.').slice(-2).join('.');
    if (domain.includes('.')) {
      document.cookie = `googtrans=${cookieValue}; domain=.${domain}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
    }
    
    // Refresh the page to apply translation
    window.location.reload();
  };

  const currentLangName = languages.find(l => l.code === currentLang)?.name || 'English';
  const currentFlag = languages.find(l => l.code === currentLang)?.flag || '🇺🇸';

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-green-50 transition-all group"
      >
        <div className="w-6   flex items-center justify-center overflow-hidden cursor-pointer transition-transform">
          <img src={currentFlag} alt="flag" className="w-full h-full object-cover" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 hidden sm:block">
          {currentLangName}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={() => setIsOpen(false)}
            ></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 z-[9999] overflow-hidden"
            >
              <div className="p-2 flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`flex items-center justify-between cursor-pointer px-3 py-2.5 rounded-xl transition-all ${
                      currentLang === lang.code 
                        ? 'bg-green-50 text-emerald-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6  overflow-hidden ">
                        <img src={lang.flag} alt={lang.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </div>
                    {currentLang === lang.code && <Check size={14} className="text-emerald-500" />}
                  </button>
                ))}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleTranslator;
