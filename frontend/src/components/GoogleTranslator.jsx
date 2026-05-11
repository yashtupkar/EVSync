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
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length >= 2) {
        const val = parts.pop().split(';').shift();
        return val ? val.replace(/^"|"$/g, '') : null;
      }
      return null;
    };

    const googTrans = getCookie('googtrans');
    const savedLang = localStorage.getItem('userLanguage');

    if (googTrans) {
      const lang = googTrans.split('/').pop();
      if (lang && lang.length <= 5) {
        setCurrentLang(lang);
        if (lang !== savedLang) {
          localStorage.setItem('userLanguage', lang);
        }
      }
    } else if (savedLang && savedLang !== 'en') {
      // Safeguard against reload loops: 
      // Only auto-apply if we haven't reloaded for this reason in the last 10 seconds
      const lastAutoApply = sessionStorage.getItem('last_lang_auto_apply');
      const now = Date.now();
      
      if (!lastAutoApply || (now - parseInt(lastAutoApply)) > 10000) {
        sessionStorage.setItem('last_lang_auto_apply', now.toString());
        setCurrentLang(savedLang);
        applyLanguage(savedLang);
      } else {
        // If we are likely in a loop, just set the state but don't reload
        setCurrentLang(savedLang);
      }
    }
  }, []);

  const applyLanguage = (langCode) => {
    const cookieValue = `/en/${langCode}`;
    
    // Set cookie for current domain and base domain
    const hostname = window.location.hostname;
    const domainParts = hostname.split('.');
    const baseDomain = domainParts.length >= 2 ? `.${domainParts.slice(-2).join('.')}` : '';

    // Clear existing
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    if (baseDomain) document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${baseDomain};`;

    // Set new
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    if (baseDomain) {
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${baseDomain};`;
    }

    localStorage.setItem('userLanguage', langCode);
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const changeLanguage = (langCode) => {
    if (langCode === currentLang) {
      setIsOpen(false);
      return;
    }
    // Set a manual reload flag to skip the auto-apply safeguard
    sessionStorage.setItem('last_lang_auto_apply', Date.now().toString());
    setCurrentLang(langCode);
    setIsOpen(false);
    applyLanguage(langCode);
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
