import { memo } from 'react';
import { Room, type RoomRenderProps } from './Room';
import { stairLines } from '../maps/geometry';
import { project } from '../maps/projection';

/** Cầu thang: dùng khối Room và vẽ thêm các bậc thang trên mặt sàn. */
function StaircaseImpl(props: Omit<RoomRenderProps, 'overlay'>) {
  return (
    <Room
      {...props}
      overlay={(poly, zTop) => {
        const lines = stairLines(poly, 9);
        const d = lines
          .map(([a, b]) => {
            const pa = project(a, zTop, props.cam);
            const pb = project(b, zTop, props.cam);
            return `M${pa[0].toFixed(2)},${pa[1].toFixed(2)}L${pb[0].toFixed(2)},${pb[1].toFixed(2)}`;
          })
          .join('');
        return <path d={d} className="stair-steps" />;
      }}
    />
  );
}

export const Staircase = memo(StaircaseImpl);

