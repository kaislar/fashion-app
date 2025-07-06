import React from 'react';
import { getEnabledImportMethods, importConfig } from './config/importConfig';

type ImportWizardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  step: number;
  setStep: (step: number) => void;
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
};

const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  step,
  setStep,
  selectedMethod,
  setSelectedMethod
}) => {
  const importMethods = getEnabledImportMethods();

  const renderStep1 = () => (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24, textAlign: 'center' }}>Choose Import Method</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 20,
        marginBottom: 32
      }}>
        {importMethods.map(method => (
          <div
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            style={{
              background: selectedMethod === method.id ? method.color : 'rgba(255,255,255,0.05)',
              borderRadius: 20,
              padding: 24,
              border: selectedMethod === method.id ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.18)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{method.icon}</div>
              <h4 style={{ fontWeight: 600, fontSize: 20, marginBottom: 8, color: 'white' }}>{method.name}</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.4 }}>{method.description}</p>
            </div>
            {method.id !== 'csv' && (
              <button
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  alignSelf: 'flex-start',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open API configuration
                }}
              >
                Configure API
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn-secondary"
          onClick={onClose}
          style={{ padding: '14px 28px', fontSize: 16, fontWeight: 600 }}
        >
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={() => setStep(2)}
          disabled={!selectedMethod}
          style={{ padding: '14px 28px', fontSize: 16, fontWeight: 600 }}
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24, textAlign: 'center' }}>Configuration</h3>
      <div style={{ marginBottom: 32 }}>
        {selectedMethod === 'csv' ? (
          <div>
            <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>File Upload</h4>

            {/* File Format Instructions */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h5 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#bfcfff' }}>📋 CSV/Excel Format Instructions</h5>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                <p style={{ marginBottom: 8 }}>
                  <strong>Required columns:</strong> Product Name, SKU
                </p>
                <p style={{ marginBottom: 8 }}>
                  <strong>Optional columns:</strong> Price, Page URL, Category, Image URL
                </p>
                <p style={{ marginBottom: 8 }}>
                  <strong>Multiple images:</strong> Create one row per image. Duplicate the product data and change only the Image URL.
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  Example: A product with 3 images = 3 rows with same Name/SKU but different Image URLs
                </p>
              </div>
            </div>

            <div style={{
              border: '2px dashed rgba(255,255,255,0.3)',
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.05)',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>Drag and drop your file here or click to browse</p>
              <button className="btn-secondary">Choose File</button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Supported formats: {importConfig.supportedFormats.map(f => f.toUpperCase()).join(', ')}. Max file size: {(importConfig.maxFileSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </div>
        ) : (
          <div>
            <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>API Configuration</h4>
            {importConfig.showApiConfig ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <input
                  type="text"
                  placeholder="Store URL"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1.5px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.10)',
                    color: 'white',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="API Key"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1.5px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.10)',
                    color: 'white',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="API Secret (if required)"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1.5px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.10)',
                    color: 'white',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 }}>
                  API configuration is currently disabled
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  Contact your administrator to enable API integrations
                </p>
              </div>
            )}
          </div>
        )}

        {selectedMethod !== 'csv' && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Scheduling</h4>
            <div style={{ display: 'grid', gap: 16 }}>
              <select
                defaultValue={importConfig.defaultSchedule}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.10)',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="once">Import Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {importConfig.showNotifications && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="checkbox"
                    id="notifications"
                    style={{ marginRight: 8 }}
                  />
                  <label htmlFor="notifications" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                    Send email notifications on import completion
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn-secondary"
          onClick={() => setStep(1)}
          style={{ padding: '12px 24px' }}
        >
          Back
        </button>
        <button
          className="btn-primary"
          onClick={() => setStep(3)}
          style={{ padding: '12px 24px' }}
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24, textAlign: 'center' }}>Preview & Mapping</h3>
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Sample Data Preview</h4>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          maxHeight: 200,
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', fontSize: 12 }}>
            <thead>
              <tr style={{ color: 'rgba(255,255,255,0.6)' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Product Name *</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>SKU *</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Price</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Page URL</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Image URL</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ color: 'rgba(255,255,255,0.8)' }}>
                <td style={{ padding: '8px' }}>Classic T-Shirt</td>
                <td style={{ padding: '8px' }}>tshirt-001</td>
                <td style={{ padding: '8px' }}>19.99</td>
                <td style={{ padding: '8px' }}>https://example.com/tshirt</td>
                <td style={{ padding: '8px' }}>Clothing</td>
                <td style={{ padding: '8px' }}>https://example.com/tshirt-front.jpg</td>
              </tr>
              <tr style={{ color: 'rgba(255,255,255,0.8)' }}>
                <td style={{ padding: '8px' }}>Classic T-Shirt</td>
                <td style={{ padding: '8px' }}>tshirt-001</td>
                <td style={{ padding: '8px' }}>19.99</td>
                <td style={{ padding: '8px' }}>https://example.com/tshirt</td>
                <td style={{ padding: '8px' }}>Clothing</td>
                <td style={{ padding: '8px' }}>https://example.com/tshirt-back.jpg</td>
              </tr>
              <tr style={{ color: 'rgba(255,255,255,0.8)' }}>
                <td style={{ padding: '8px' }}>Classic T-Shirt</td>
                <td style={{ padding: '8px' }}>tshirt-001</td>
                <td style={{ padding: '8px' }}>19.99</td>
                <td style={{ padding: '8px' }}>https://example.com/tshirt</td>
                <td style={{ padding: '8px' }}>Clothing</td>
                <td style={{ padding: '8px' }}>https://example.com/tshirt-side.jpg</td>
              </tr>
              <tr style={{ color: 'rgba(255,255,255,0.8)' }}>
                <td style={{ padding: '8px' }}>Denim Jeans</td>
                <td style={{ padding: '8px' }}>jeans-002</td>
                <td style={{ padding: '8px' }}>49.99</td>
                <td style={{ padding: '8px' }}>https://example.com/jeans</td>
                <td style={{ padding: '8px' }}>Bottoms</td>
                <td style={{ padding: '8px' }}>https://example.com/jeans-front.jpg</td>
              </tr>
              <tr style={{ color: 'rgba(255,255,255,0.8)' }}>
                <td style={{ padding: '8px' }}>Denim Jeans</td>
                <td style={{ padding: '8px' }}>jeans-002</td>
                <td style={{ padding: '8px' }}>49.99</td>
                <td style={{ padding: '8px' }}>https://example.com/jeans</td>
                <td style={{ padding: '8px' }}>Bottoms</td>
                <td style={{ padding: '8px' }}>https://example.com/jeans-back.jpg</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Field Mapping</h4>
        <div style={{ display: 'grid', gap: 12 }}>
          {/* Required Fields */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#ff6b6b', fontSize: 12, fontWeight: 600 }}>Required Fields</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, minWidth: 80 }}>Name *:</span>
            <select
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                flex: 1
              }}
            >
              <option value="name">Product Name</option>
              <option value="title">Title</option>
              <option value="product_name">Product Name</option>
              <option value="product_title">Product Title</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, minWidth: 80 }}>SKU *:</span>
            <select
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                flex: 1
              }}
            >
              <option value="sku">SKU</option>
              <option value="code">Code</option>
              <option value="id">ID</option>
              <option value="product_id">Product ID</option>
            </select>
          </div>

          {/* Optional Fields */}
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <span style={{ color: '#bfcfff', fontSize: 12, fontWeight: 600 }}>Optional Fields</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, minWidth: 80 }}>Price:</span>
            <select
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                flex: 1
              }}
            >
              <option value="price">Price</option>
              <option value="regular_price">Regular Price</option>
              <option value="sale_price">Sale Price</option>
              <option value="cost">Cost</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, minWidth: 80 }}>Page URL:</span>
            <select
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                flex: 1
              }}
            >
              <option value="page_url">Page URL</option>
              <option value="url">URL</option>
              <option value="link">Link</option>
              <option value="product_url">Product URL</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, minWidth: 80 }}>Category:</span>
            <select
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                flex: 1
              }}
            >
              <option value="category">Category</option>
              <option value="type">Type</option>
              <option value="product_type">Product Type</option>
              <option value="department">Department</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, minWidth: 80 }}>Image URL:</span>
            <select
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                flex: 1
              }}
            >
              <option value="image_url">Image URL</option>
              <option value="image">Image</option>
              <option value="photo">Photo</option>
              <option value="picture">Picture</option>
              <option value="img">Img</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn-secondary"
          onClick={() => setStep(2)}
          style={{ padding: '12px 24px' }}
        >
          Back
        </button>
        <button
          className="btn-primary"
          onClick={() => setStep(4)}
          style={{ padding: '12px 24px' }}
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24, textAlign: 'center' }}>Review & Execute</h3>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20
        }}>
          <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Import Summary</h4>
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Import Method:</span>
              <span style={{ color: 'white', fontWeight: 600 }}>
                {importMethods.find(m => m.id === selectedMethod)?.name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Products to Import:</span>
              <span style={{ color: 'white', fontWeight: 600 }}>~150 products</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Estimated Time:</span>
              <span style={{ color: 'white', fontWeight: 600 }}>2-3 minutes</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Schedule:</span>
              <span style={{ color: 'white', fontWeight: 600 }}>Import Once</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <input
            type="checkbox"
            id="confirm"
            style={{ marginRight: 8 }}
          />
          <label htmlFor="confirm" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            I confirm that I have the right to import this data
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn-secondary"
          onClick={() => setStep(3)}
          style={{ padding: '12px 24px' }}
        >
          Back
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            // TODO: Execute import
            onClose();
          }}
          style={{ padding: '12px 24px' }}
        >
          Start Import
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(10,10,10,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(30,32,44,0.98)',
        borderRadius: 24,
        padding: '3rem 3rem',
        color: 'white',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        border: '2.5px solid rgba(255,255,255,0.18)',
        minWidth: 900,
        maxWidth: 1200,
        width: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 18,
            boxShadow: '0 2px 6px #0003'
          }}
        >
          ×
        </button>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 40,
          gap: 16
        }}>
          {[1, 2, 3, 4].map(stepNum => (
            <div
              key={stepNum}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: step >= stepNum ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: step >= stepNum ? 'white' : 'rgba(255,255,255,0.6)',
                border: step >= stepNum ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {stepNum}
            </div>
          ))}
        </div>

        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default ImportWizardModal;
