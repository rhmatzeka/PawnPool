import React from 'react';
import { Square } from '../../types/chess';

interface ChessSquareProps {
  square: Square;
  isLight: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const ChessSquare: React.FC<ChessSquareProps> = ({
  square,
  isLight,
  children,
  onClick,
}) => {
  const bgClass = isLight 
    ? 'bg-[#eedcbf] text-[#b58863]' // warna kayu terang
    : 'bg-[#b58863] text-[#eedcbf]'; // warna kayu gelap

  return (
    <div 
      className={`relative w-full aspect-square flex items-center justify-center select-none ${bgClass} transition-colors duration-200 cursor-default`}
      onClick={onClick}
    >
      {/* Label coordinate di pojok-pojok board */}
      <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold opacity-30 select-none">
        {square}
      </span>
      {children}
    </div>
  );
};
export default ChessSquare;
