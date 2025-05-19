import { useState, useEffect, useRef } from 'react';
import './LibraryModal.css';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, path: string) => Promise<void>;
}

const LibraryModal = ({ isOpen, onClose, onSave }: LibraryModalProps) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPath('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsSubmitting(true);
      setError(null);
      
      try {
        await onSave(name, path);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create library');
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h2>Create New Library</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="library-name">Library Name</label>
            <input
              id="library-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter library name"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="library-path">Library Path (optional)</label>
            <input
              id="library-path"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Enter path to store library files"
              disabled={isSubmitting}
            />
            <small className="help-text">Leave empty to use default storage</small>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LibraryModal;
