import React, { useState, useEffect, useCallback } from 'react';
import { 
    Eye, 
    CheckCircle, 
    XCircle,
    ArrowLeft,
    Calendar,
    MapPin,
    Users,
    Clock,
    Phone,
    Mail,
    DollarSign,
    AlertCircle,
    Loader
} from 'lucide-react';
import { 
    getAllEventBookings, 
    approveEventBooking, 
    rejectEventBooking 
} from '../../../services/service';
import dayjs from "dayjs";

// Helper Functions
const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0);

const getStatusProps = (status) => {
    switch (status) {
        case 'Baru': return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'Menunggu Persetujuan' };
        case 'Menunggu Pembayaran': return { color: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Menunggu Pembayaran' }; 
        case 'Confirmed': return { color: 'bg-green-100 text-green-800 border-green-300', text: 'Lunas / Confirmed' };
        case 'Selesai': return { color: 'bg-gray-100 text-gray-800 border-gray-300', text: 'Selesai' };
        case 'Dibatalkan': return { color: 'bg-red-100 text-red-800 border-red-300', text: 'Ditolak/Dibatalkan' };
        default: return { color: 'bg-gray-100 text-gray-800 border-gray-300', text: status };
    }
};

// Komponen Notifikasi (Message)
const Message = ({ message }) => {
    if (!message) return null;
    const bgColor = message.type === 'success' ? 'bg-green-100' : 'bg-red-100';
    const textColor = message.type === 'success' ? 'text-green-800' : 'text-red-800';
    const borderColor = message.type === 'success' ? 'border-green-300' : 'border-red-300';
    return (
        <div className={`fixed top-4 right-4 ${bgColor} ${textColor} border ${borderColor} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
        </div>
    );
};

// Komponen Tampilan Daftar (Card List View)
const CardListView = ({ eventRequests, loading, selectedTab, setSelectedTab, handleCardClick }) => (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Space Approval</h1>
            <p className="text-gray-600">Kelola persetujuan booking event space</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200 overflow-x-auto">
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6 min-w-max">
                    {[
                        { key: 'pending', label: 'Menunggu Persetujuan', count: eventRequests.pending.length },
                        { key: 'awaiting_payment', label: 'Menunggu Pembayaran', count: eventRequests.awaiting_payment.length }, // Tab Baru
                        { key: 'approved', label: 'Lunas / Confirmed', count: eventRequests.approved.length },
                        { key: 'rejected', label: 'Ditolak', count: eventRequests.rejected.length }
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setSelectedTab(tab.key)} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${selectedTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </nav>
            </div>
        </div>

        {loading && (
            <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )}
        
        {!loading && (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {eventRequests[selectedTab]?.map((event) => (
                        <div key={event.id} onClick={() => handleCardClick(event)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200">
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 pr-2">{event.eventName}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusProps(event.status).color}`}>
                                        {getStatusProps(event.status).text}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">#{event.id}</p>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600"><Users className="w-4 h-4 mr-2 flex-shrink-0" /><span className="truncate">{event.customerName}</span></div>
                                <div className="flex items-center text-sm text-gray-600"><MapPin className="w-4 h-4 mr-2 flex-shrink-0" /><span className="truncate">{event.spaceName}</span></div>
                                <div className="flex items-center text-sm text-gray-600"><Calendar className="w-4 h-4 mr-2 flex-shrink-0" /><span>{dayjs(event.date).format("DD MMMM YYYY")}</span></div>
                                <div className="flex items-center text-sm text-gray-600"><DollarSign className="w-4 h-4 mr-2 flex-shrink-0" /><span className="font-semibold text-green-600">{formatPrice(event.price)}</span></div>
                            </div>
                            <div className="border-t pt-4">
                                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" onClick={(e) => { e.stopPropagation(); handleCardClick(event); }}>
                                    <Eye className="w-4 h-4 mr-2" /> Lihat Detail
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {eventRequests[selectedTab]?.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-gray-400 mb-4"><Calendar className="w-12 h-12 mx-auto" /></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada event</h3>
                        <p className="text-gray-600">Belum ada data dalam kategori ini.</p>
                    </div>
                )}
            </>
        )}
    </div>
);

// Komponen Tampilan Detail
const DetailView = ({ selectedEvent, handleBackToList, onOpenApproveModal, setRejectModalVisible }) => (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
            <div className="mb-4">
                <button onClick={handleBackToList} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-2">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Kembali
                </button>
            </div>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{selectedEvent?.eventName}</h1>
                    <p className="text-gray-600 mt-2">ID: #{selectedEvent?.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusProps(selectedEvent?.status).color}`}>
                    {getStatusProps(selectedEvent?.status).text}
                </span>
            </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
                {/* Info Customer, Detail Event, Info Lainnya */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Informasi Customer</h3>
                    <div className="space-y-3">
                        <div><p className="text-sm text-gray-500">Nama</p><p className="font-medium">{selectedEvent?.customerName}</p></div>
                        <div className="flex items-center text-gray-600"><Phone className="w-4 h-4 mr-2" /><span>{selectedEvent?.phone}</span></div>
                        <div className="flex items-center text-gray-600"><Mail className="w-4 h-4 mr-2" /><span>{selectedEvent?.email}</span></div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Detail Event</h3>
                    <div className="space-y-3">
                        <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2" /><span>{selectedEvent?.spaceName}</span></div>
                        <div className="flex items-center text-gray-600"><Calendar className="w-4 h-4 mr-2" /><span>{dayjs(selectedEvent?.date).format("DD MMMM YYYY")}</span></div>
                        <div className="flex items-center text-gray-600"><Clock className="w-4 h-4 mr-2" /><span>{selectedEvent?.time} ({selectedEvent?.duration} jam)</span></div>
                        <div className="flex items-center text-gray-600"><Users className="w-4 h-4 mr-2" /><span>{selectedEvent?.guests} orang</span></div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Informasi Lainnya</h3>
                    <div className="space-y-3">
                        <div><p className="text-sm text-gray-500">Total Biaya {selectedEvent?.status === 'Baru' ? '(Estimasi)' : ''}</p><div className="flex items-center text-green-600 font-semibold text-xl"><DollarSign className="w-5 h-5 mr-1" />{formatPrice(selectedEvent?.price)}</div></div>
                        <div><p className="text-sm text-gray-500">Waktu Submit</p><p>{dayjs(selectedEvent?.submittedAt).format("DD MMMM YYYY, HH:mm")}</p></div>
                    </div>
                </div>
            </div>
            {/* Description & Requirements */}
            {selectedEvent?.description && (<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"><h4 className="font-semibold mb-3">Deskripsi Event</h4><p className="text-gray-700 leading-relaxed">{selectedEvent?.description}</p></div>)}
            {selectedEvent?.requirements && (<div className="mb-6"><h4 className="font-semibold mb-3">Kebutuhan Fasilitas</h4><div className="flex flex-wrap gap-2"><span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-300">{selectedEvent?.requirements}</span></div></div>)}
            {/* Rejection Reason */}
            {selectedEvent?.rejectionReason && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><h4 className="font-semibold text-red-900 mb-2">Alasan Penolakan</h4><p className="text-red-700">{selectedEvent.rejectionReason}</p></div>)}
            
            {/* Action Buttons */}
            {(selectedEvent?.status === 'Baru') && (
                <div className="border-t pt-6"><div className="flex justify-end space-x-4">
                    <button onClick={() => setRejectModalVisible(true)} className="px-6 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center">
                        <XCircle className="w-5 h-5 mr-2" /> Tolak Event
                    </button>
                    
                    {/* TOMBOL SETUJUI MEMBUKA MODAL HARGA */}
                    <button onClick={() => onOpenApproveModal(selectedEvent)} className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" /> Setujui & Tetapkan Harga
                    </button>
                </div></div>
            )}
        </div>
    </div>
);


const EventSpacesAdmin = () => {
    const [eventRequests, setEventRequests] = useState({ 
        pending: [], 
        awaiting_payment: [], // Tab Baru
        approved: [], 
        rejected: [] 
    });
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('pending');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    
    // Modal Penolakan
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    
    // Modal Approval (Harga)
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [finalPrice, setFinalPrice] = useState('');

    const [message, setMessage] = useState(null);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllEventBookings();
            
            // --- PERBAIKAN UTAMA DI SINI ---
            // Karena Backend sudah mengelompokkan dengan benar,
            // kita tinggal pasang ke state tanpa filter manual lagi.
            setEventRequests({
                pending: data.pending || [],
                awaiting_payment: data.awaiting_payment || [], 
                approved: data.approved || [],
                rejected: data.rejected || [],
            });

        } catch (error) {
            showMessage('error', error.message || "Gagal memuat data booking.");
            setEventRequests({ pending: [], awaiting_payment: [], approved: [], rejected: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- HANDLER APPROVE DENGAN HARGA ---
    const openApproveModal = (event) => {
        setSelectedEvent(event);
        setFinalPrice(event.price || ''); // Isi default dengan harga estimasi
        setApproveModalVisible(true);
    };

    const submitApproval = async () => {
        if (!finalPrice || finalPrice <= 0) {
            showMessage('error', "Mohon masukkan harga yang valid.");
            return;
        }

        try {
            // Panggil Service Backend dengan parameter harga
            await approveEventBooking(selectedEvent.id, finalPrice);
            
            showMessage('success', `Event #${selectedEvent.id} disetujui! Menunggu pembayaran user.`);
            setApproveModalVisible(false);
            setShowDetail(false);
            setSelectedEvent(null);
            fetchData(); // Refresh data agar pindah tab
        } catch (error) {
            showMessage('error', error.message || "Gagal menyetujui event.");
        }
    };
    // ------------------------------------

    const handleReject = async () => {
        try {
            await rejectEventBooking(selectedEvent?.id, rejectReason);
            showMessage('success', `Event #${selectedEvent?.id} telah ditolak.`);
            setRejectModalVisible(false);
            setRejectReason('');
            setShowDetail(false);
            setSelectedEvent(null);
            fetchData();
        } catch (error) {
            showMessage('error', error.message || "Gagal menolak event.");
        }
    };

    const handleCardClick = (event) => {
        setSelectedEvent(event);
        setShowDetail(true);
    };

    const handleBackToList = () => {
        setShowDetail(false);
        setSelectedEvent(null);
    };

    return (
        <div>
            <Message message={message} />
            
            {showDetail ? (
                <DetailView 
                    selectedEvent={selectedEvent}
                    handleBackToList={handleBackToList}
                    onOpenApproveModal={openApproveModal} 
                    setRejectModalVisible={setRejectModalVisible}
                />
            ) : (
                <CardListView 
                    eventRequests={eventRequests}
                    loading={loading}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                    handleCardClick={handleCardClick}
                />
            )}

            {/* MODAL PENOLAKAN */}
            {rejectModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Tolak Event Space</h2>
                            <p className="text-gray-600 mb-4">
                                Anda yakin ingin menolak event <strong>{selectedEvent?.eventName}</strong>?
                            </p>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Alasan (Opsional)</label>
                                <textarea className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none" rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Masukkan alasan..."/>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => { setRejectModalVisible(false); setRejectReason(''); }} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Batal</button>
                                <button onClick={handleReject} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Ya, Tolak</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INPUT HARGA (APPROVAL) */}
            {approveModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Setujui & Tetapkan Harga
                            </h2>
                            <p className="text-gray-600 mb-4 text-sm">
                                Masukkan harga final yang harus dibayar oleh customer <strong>{selectedEvent?.customerName}</strong> untuk acara <strong>{selectedEvent?.eventName}</strong>.
                            </p>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Total Harga (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                                    <input 
                                        type="number" 
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
                                        value={finalPrice} 
                                        onChange={(e) => setFinalPrice(e.target.value)} 
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    *Estimasi sistem: {formatPrice(selectedEvent?.price)}
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={() => setApproveModalVisible(false)} 
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={submitApproval} 
                                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Konfirmasi & Kirim
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EventSpacesAdmin;