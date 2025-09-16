/**
 * Componente per toggle tema chiaro/scuro
 * Integrato con next-themes per persistenza
 */

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}

/**
 * Toggle semplice tra chiaro e scuro
 */
const SimpleThemeToggle: React.FC<{ className?: string; showLabel?: boolean }> = ({
  className = '',
  showLabel = false
}) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    // Evita idratazione mismatch
    return (
      <div className={`w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center p-2 rounded-lg
        bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
        border border-gray-200 dark:border-gray-600 transition-all duration-200
        focus-ring ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Passa al tema ${resolvedTheme === 'dark' ? 'chiaro' : 'scuro'}`}
    >
      <AnimatePresence mode="wait">
        {resolvedTheme === 'dark' ? (
          <motion.div
            key="dark"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-blue-400" />
          </motion.div>
        ) : (
          <motion.div
            key="light"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-yellow-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {showLabel && (
        <span className="ml-2 text-sm font-medium text-primary dark:text-primary">
          {resolvedTheme === 'dark' ? 'Scuro' : 'Chiaro'}
        </span>
      )}
    </motion.button>
  );
};

/**
 * Dropdown con opzioni sistema/chiaro/scuro
 */
const DropdownThemeToggle: React.FC<{ className?: string }> = ({
  className = ''
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Chiudi dropdown quando si clicca fuori
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  const temaCorrente = resolvedTheme === 'dark' ? 'dark' : 'light';

  const opzioniTema = [
    { value: 'light', label: 'Chiaro', icon: Sun },
    { value: 'dark', label: 'Scuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor }
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Pulsante principale */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-center p-2 rounded-lg
          bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
          border border-gray-200 dark:border-gray-600 transition-all duration-200
          focus-ring
        "
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {temaCorrente === 'dark' ? (
            <Moon key="dark-icon" className="w-5 h-5 text-blue-400" />
          ) : (
            <Sun key="light-icon" className="w-5 h-5 text-yellow-500" />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              absolute right-0 mt-2 py-2 w-32 bg-surface dark:bg-surface rounded-lg
              shadow-lg dark:shadow-xl border border-custom z-50
            "
          >
            {opzioniTema.map((opzione) => {
              const IconComponent = opzione.icon;
              const isSelected = theme === opzione.value;

              return (
                <motion.button
                  key={opzione.value}
                  onClick={() => {
                    setTheme(opzione.value);
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center w-full px-3 py-2 text-left text-sm
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                    ${isSelected ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-primary dark:text-primary'}
                  `}
                  whileHover={{ x: 2 }}
                >
                  <IconComponent className="w-4 h-4 mr-3" />
                  <span className="flex-1">{opzione.label}</span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-primary-500"
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Componente principale ThemeToggle
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  variant = 'button'
}) => {
  if (variant === 'dropdown') {
    return <DropdownThemeToggle className={className} />;
  }

  return <SimpleThemeToggle className={className} showLabel={showLabel} />;
};

export default ThemeToggle;