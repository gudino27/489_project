import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { MessageSquare, ArrowRight } from 'lucide-react';

const DesignerOrContactChoice = ({ className = '', onQuickQuoteClick }) => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();

  const handleQuickQuoteClick = () => {
    if (onQuickQuoteClick) return onQuickQuoteClick();
    navigate('/quick-quote');
  };

  const content = {
    en: {
      designer: {
        title: 'Use Our Designer',
        description: 'Design your dream kitchen or bathroom with our interactive 3D designer tool.',
        features: [
          'Interactive 3D visualization',
          'Real-time pricing',
          'Customize colors and materials',
          'Save and share your design',
        ],
        button: 'Start Designing',
        badge: 'Most Popular',
      },
      quickQuote: {
        title: 'Quick Quote Form',
        description: 'Tell us about your project and get a personalized quote from our team.',
        features: [
          'Fast and simple',
          'Upload inspiration photos',
          'Get a response in 2-4 business days',
          'No design experience needed',
        ],
        button: 'Request Quote',
        badge: 'Quick & Easy',
      },
    },
    es: {
      designer: {
        title: 'Use Nuestro Diseñador',
        description: 'Diseñe su cocina o baño de ensueño con nuestra herramienta de diseño 3D interactiva.',
        features: [
          'Visualización 3D interactiva',
          'Precios en tiempo real',
          'Personalizar colores y materiales',
          'Guardar y compartir su diseño',
        ],
        button: 'Comenzar a Diseñar',
        badge: 'Más Popular',
      },
      quickQuote: {
        title: 'Formulario de Cotización Rápida',
        description: 'Cuéntenos sobre su proyecto y obtenga una cotización personalizada de nuestro equipo.',
        features: [
          'Rápido y sencillo',
          'Cargar fotos de inspiración',
          'Obtenga una respuesta en 2-4 días hábiles',
          'No se necesita experiencia en diseño',
        ],
        button: 'Solicitar Cotización',
        badge: 'Rápido & Fácil',
      },
    },
  };

  const t = content[currentLanguage] || content.en;

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden group flex flex-col ${className}`}>
      <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
        {t.quickQuote.badge}
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <MessageSquare className="text-green-600" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{t.quickQuote.title}</h3>
        </div>

        <p className="text-gray-600 mb-6">{t.quickQuote.description}</p>

        <ul className="space-y-3 mb-8 flex-1">
          {t.quickQuote.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <button onClick={handleQuickQuoteClick} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg">
          {t.quickQuote.button}
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
        <p>
          {currentLanguage === 'es'
            ? '¿No está seguro cuál elegir? Contáctenos y le ayudaremos a decidir.'
            : "Not sure which to choose? Contact us and we'll help you decide."}
        </p>
      </div>
    </div>
  );
};

export default DesignerOrContactChoice;
