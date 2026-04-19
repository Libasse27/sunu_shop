import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: Props) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className={`w-full ${sizeMap[size]} bg-white rounded-2xl shadow-xl overflow-hidden`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Bande tricolore sénégalaise */}
                <div className="flex shrink-0" style={{ height: '3px' }}>
                  <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                  <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                  <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
                </div>
                {title ? (
                  <>
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                      <Dialog.Title className="text-lg font-semibold mb-0" style={{ color: '#003D1C' }}>{title}</Dialog.Title>
                      <button onClick={onClose} className="btn-icon p-1 rounded-full hover:bg-gray-100 transition-colors" style={{ color: '#6b7280' }}>
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-6">{children}</div>
                  </>
                ) : (
                  <div className="p-6 relative">
                    <button onClick={onClose} className="btn-icon absolute p-1 rounded-full z-10" style={{ top: '12px', right: '12px' }}>
                      <X size={20} />
                    </button>
                    {children}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
