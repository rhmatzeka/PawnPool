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
  return (
    <div 
      className="relative flex aspect-square w-full items-center justify-center select-none transition-colors duration-200 cursor-default"
      onClick={onClick}
    >
      <span className={`absolute bottom-0.5 right-1 select-none font-mono text-[8px] font-black opacity-25 ${isLight ? 'text-[#8a5f35]' : 'text-[#f3dfbf]'}`}>
        {square}
      </span>
      {children}
    </div>
  );
};
export default ChessSquare;
