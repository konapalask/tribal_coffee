import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';

interface InvoiceModalProps {
  order: any;
  onClose: () => void;
  customerInfo?: any; // To pass in resolved address/phone from AdminDashboard if needed
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose, customerInfo }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };
  
  // Try to use resolved info from AdminDashboard if provided, else fallback to order object
  const customerName = order.customerName || customerInfo?.name || 'Customer';
  const email = order.email || customerInfo?.email || 'N/A';
  const phone = order.phone || customerInfo?.phone || 'N/A';
  
  let addressString = `${order.city || 'N/A'} (PIN: ${order.pincode || 'N/A'})`;
  const addr = order.fullAddress || customerInfo?.address;
  if (addr) {
    if (typeof addr === 'string') {
      addressString = addr;
    } else {
      addressString = [
        addr.doorNo, addr.area, addr.landmark, addr.city, addr.state, (addr.pinCode || addr.pincode)
      ].filter(Boolean).join(', ');
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f0a06] border border-[#D4AF37]/30 w-full max-w-3xl rounded-xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - non-printable */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40 print:hidden">
          <h2 className="text-[#D4AF37] font-playfair font-bold text-xl tracking-wider">TAX INVOICE</h2>
          <div className="flex gap-4 items-center">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-700/20 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-2 hover:bg-emerald-700/40 transition-colors uppercase text-xs tracking-wider font-bold cursor-pointer"
            >
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer transition-colors p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto bg-white text-black print:p-0 print:bg-white print:text-black">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-gray-200">
            <div>
              <h1 className="text-3xl font-black font-playfair tracking-widest text-[#4A3B2C]">TRIBAL COFFEE</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Premium Coffee Lounge</p>
              <div className="mt-4 text-sm text-gray-600 space-y-0.5">
                <p>123 Roastery Lane, Estate Valley</p>
                <p>Coorg, Karnataka - 571201</p>
                <p className="font-bold pt-1 text-gray-800">GSTIN: 29AAAAA0000A1Z5</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold tracking-widest text-gray-800 mb-2">INVOICE</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-bold">Invoice No:</span> INV-{order.id}</p>
                <p><span className="font-bold">Date:</span> {order.date || new Date().toLocaleDateString('en-IN')}</p>
                <p><span className="font-bold">Order ID:</span> {order.id}</p>
                {order.awb && <p><span className="font-bold text-indigo-700">AWB:</span> {order.awb}</p>}
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="flex justify-between mb-8">
            <div className="w-1/2">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-200 inline-block">Billed To</h3>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-bold text-gray-800 text-base">{customerName}</p>
                <p className="mt-1 leading-relaxed max-w-[250px]">{addressString}</p>
                <p className="mt-2 text-xs">Email: {email}</p>
                <p className="text-xs">Phone: {phone}</p>
              </div>
            </div>
            <div className="w-1/2 pl-8 border-l border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 border-b border-gray-200 inline-block">Shipping Status</h3>
              <div className="text-sm text-gray-600">
                <p className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-100">
                  <CheckCircle size={14} /> {order.status}
                </p>
                {order.courier && <p className="mt-3 text-xs font-semibold text-gray-700">Partner: <span className="font-normal">{order.courier}</span></p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8 text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-800 text-sm">
                <th className="py-3 px-4 font-bold border-b border-gray-200">Description</th>
                <th className="py-3 px-4 font-bold border-b border-gray-200 text-center">Quantity</th>
                <th className="py-3 px-4 font-bold border-b border-gray-200 text-right">Price</th>
                <th className="py-3 px-4 font-bold border-b border-gray-200 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, idx: number) => {
                const price = typeof item.price === 'number' ? item.price : (typeof item.price === 'string' ? parseFloat(item.price) : 0);
                const qty = item.quantity || 1;
                const total = price * qty;
                return (
                  <tr key={idx} className="border-b border-gray-100 text-sm text-gray-700">
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      {item.grind && <p className="text-xs text-gray-500 mt-0.5"><span className="font-medium text-gray-400">Grind:</span> {item.grind}</p>}
                      {item.size && <p className="text-xs text-gray-500 mt-0.5"><span className="font-medium text-gray-400">Size:</span> {item.size}</p>}
                    </td>
                    <td className="py-4 px-4 text-center font-medium">{qty}</td>
                    <td className="py-4 px-4 text-right">₹{price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900">₹{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-4">
            <div className="w-1/2 max-w-xs">
              <table className="w-full text-sm text-gray-700">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-right">Subtotal</td>
                    <td className="py-2 text-right font-medium">₹{order.amount ? order.amount.toFixed(2) : '0.00'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-right text-gray-500">Shipping</td>
                    <td className="py-2 text-right font-medium text-emerald-600">FREE</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-right text-gray-500">Tax (Included)</td>
                    <td className="py-2 text-right font-medium">₹0.00</td>
                  </tr>
                  <tr>
                    <td className="py-4 text-right font-black text-gray-900 text-base uppercase tracking-widest">Total Paid</td>
                    <td className="py-4 text-right font-black text-[#4A3B2C] text-xl">₹{order.amount ? order.amount.toFixed(2) : '0.00'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-6 font-sans">
            <p className="font-medium text-gray-500 mb-1">This is a computer generated invoice and does not require a physical signature.</p>
            <p>Thank you for choosing Tribal Coffee.</p>
            <p className="mt-0.5">For support, contact support@tribalcoffee.com | +91 1800 123 4567</p>
          </div>
        </div>

      </div>
    </div>
  );
};
