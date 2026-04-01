import React from 'react';

const ConfirmationFlip = ({ checked, onChange, disabled = false }) => {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.checked);
  };
  const id = `flip-${Math.random()}`;

  return (
    <div className="checkbox-container flex justify-center items-center">
      <div className="checkbox-wrapper">
        <input
          type="checkbox"
          className="checkbox hidden"
          id={id}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <label className="checkbox-label relative inline-flex items-center cursor-pointer" htmlFor={id}>
          <div className="checkbox-flip w-[60px] h-[60px] perspective-[1000px] flex justify-center items-center relative transition-transform duration-300 hover:scale-110">
            <div className="checkbox-front absolute w-full h-full flex justify-center items-center rounded-xl bg-gradient-to-br from-[#ff6347] to-[#f76c6c] backface-hidden transition-transform duration-300 rotate-y-0">
              <svg fill="white" height="32" width="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H12V19H11V13H5V12H11V6H12V12H19V13Z" className="stroke-white stroke-2 fill-transparent" />
              </svg>
            </div>
            <div className="checkbox-back absolute w-full h-full flex justify-center items-center rounded-xl bg-gradient-to-br from-[#36b54a] to-[#00c1d4] backface-hidden transition-transform duration-300 rotate-y-180">
              <svg fill="white" height="32" width="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 19l-7-7 1.41-1.41L9 16.17l11.29-11.3L22 6l-13 13z" className="stroke-white stroke-2 fill-transparent" />
              </svg>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default ConfirmationFlip;