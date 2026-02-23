import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Send, Zap, MessageSquare, Loader2 } from "lucide-react";
import { getFAQList, postUserQuestion } from "../../../services/service"; // Adjust path as needed
import { message } from "antd"; 

const FAQPage = () => {
  const [faqData, setFaqData] = useState([]); 
  const [openIndex, setOpenIndex] = useState(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Data on Mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getFAQList();
      // Ensure we always set an array to avoid map errors
      setFaqData(Array.isArray(data) ? data : []); 
    } catch (error) {
      console.error("Error fetching FAQs", error);
      message.error("Gagal memuat pertanyaan umum.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 2. Submit New Question
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);
    try {
      await postUserQuestion(newQuestion);
      
      // Optimistic UI Update: Show the question immediately to the user
      // Note: In reality, this data is 'Menunggu' in DB, but we show it here for UX
      const optimisticFAQ = { 
        question: newQuestion, 
        answer: "Terima kasih! Pertanyaan Anda telah disimpan dan sedang menunggu jawaban dari Admin." 
      };
      
      setFaqData([optimisticFAQ, ...faqData]);
      setNewQuestion("");
      message.success("Pertanyaan berhasil dikirim!");
      
    } catch (error) {
      console.error(error);
      message.error("Gagal mengirim pertanyaan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-20 px-4 relative overflow-hidden font-sans">
      
      {/* --- Visual Decorations --- */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div className="absolute top-0 -left-16 w-48 h-48 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 -right-16 w-48 h-48 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-3xl mx-auto space-y-12 relative z-10">
        
        {/* --- Header Section --- */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
            <Zap className="inline w-8 h-8 mr-2 text-indigo-500 fill-indigo-500" /> 
            Wawasan Cepat <br className="sm:hidden" /> Seputar Dago Creative Hub
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto font-light leading-relaxed">
            Temukan jawaban instan untuk pertanyaan umum seputar layanan, fasilitas, dan aktivitas di 
            <span className="font-bold text-indigo-600"> Dago Creative Hub</span>.
          </p>
        </div>

        {/* --- FAQ List Section --- */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100">
                <Loader2 className="animate-spin mx-auto text-indigo-500 w-10 h-10 mb-3" />
                <p className="text-gray-500 font-medium">Sedang memuat pertanyaan...</p>
            </div>
          ) : faqData.length === 0 ? (
             <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100">
                <MessageSquare className="mx-auto text-gray-300 w-12 h-12 mb-3" />
                <p className="text-gray-500 text-lg">Belum ada pertanyaan umum yang tersedia.</p>
             </div>
          ) : (
            faqData.map((item, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg transition-all duration-300 border-2 overflow-hidden ${
                    openIndex === index 
                    ? 'border-indigo-400 shadow-indigo-200/50 scale-[1.02]' 
                    : 'border-transparent hover:border-indigo-200'
                }`}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex justify-between items-center font-semibold text-left p-5 text-gray-800 text-lg transition-colors duration-200 group focus:outline-none"
                >
                  <div className="flex items-center flex-1 pr-4">
                      <span className={`mr-4 p-2 rounded-lg transition-colors duration-200 ${
                          openIndex === index ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                      }`}>
                        <MessageSquare size={20} />
                      </span>
                      <span className={`transition-colors ${openIndex === index ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {item.question}
                      </span>
                  </div>
                  
                  {openIndex === index ? (
                    <ChevronUp size={24} className="text-indigo-600 min-w-[24px]" />
                  ) : (
                    <ChevronDown size={24} className="text-gray-400 min-w-[24px] group-hover:text-indigo-400" />
                  )}
                </button>

                {openIndex === index && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="border-t border-indigo-50 pt-4 pl-[3.5rem]">
                      <p className="text-gray-600 leading-relaxed bg-indigo-50/50 p-4 rounded-lg animate-fadeIn text-base border border-indigo-50">
                        {item.answer || "Pertanyaan ini sedang menunggu jawaban dari Admin."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* --- Submission Form Section --- */}
        <div className="bg-white p-8 shadow-xl rounded-2xl border border-indigo-100 mt-12 relative overflow-hidden">
          {/* Decorative background element for form */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-900 text-center mb-3">
              Belum Menemukan Jawaban?
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
              Jangan ragu untuk bertanya! Tim kami akan segera meninjau dan menjawab pertanyaan Anda.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <textarea
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 min-h-[120px] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white focus:outline-none transition-all resize-none text-gray-700 placeholder-gray-400"
                  placeholder="Tulis pertanyaan Anda di sini..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
                    {newQuestion.length} karakter
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newQuestion.trim()}
                className={`font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg transform active:scale-[0.98] ${
                  isSubmitting || !newQuestion.trim()
                    ? "bg-gray-300 cursor-not-allowed text-gray-500 shadow-none"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300"
                }`}
              >
                {isSubmitting ? (
                   <Loader2 className="animate-spin" size={20} />
                ) : (
                   <Send size={20} /> 
                )}
                {isSubmitting ? "Sedang Mengirim..." : "Kirim Pertanyaan"}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Pertanyaan baru akan dimoderasi terlebih dahulu.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
};

export default FAQPage;