import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function StandardTextInput({ 
  value, 
  onChange, 
  placeholder, 
  isPassword,
  type = 'text', 
  name,
  className = '', 
  required = false
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Toggle between normal and password text visibility
  const getInputType = () => {
    if (isPassword) {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  return (
    <div className={`w-full flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 my-2 transition-colors duration-200 focus-within:border-slate-900 dark:focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-900 dark:focus-within:ring-slate-400 ${className}`}>
      <input
        type={getInputType()}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="flex-1 font-medium bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm w-full focus:outline-none focus:ring-0"
      />
      
      {isPassword && (
        <button
          type="button" // Type="button" stops forms from submitting early
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 focus:outline-none text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          {showPassword ? (
            <EyeOff size={18} className="stroke-current" />
          ) : (
            <Eye size={18} className="stroke-current" />
          )}
        </button>
      )}
    </div>
  );
}
