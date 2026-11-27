import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { searchRooms } from '../features/campus-map/maps/search';
import { buildRouteToRoom } from '../features/campus-map/maps/wayfinding';
import { getRoomRef } from '../features/campus-map/data';
import { project } from '../features/campus-map/maps/projection';
import { MapPage } from '../pages/MapPage';

describe('campus map search & wayfinding', () => {
  it('finds rooms by alias, Vietnamese without diacritics, and code', () => {
    const byAlias = searchRooms('X01');
    expect(byAlias.length).toBeGreaterThan(0);
    expect(byAlias.map((h) => h.ref.room.code)).toContain('A201');

    const byName = searchRooms('thu vien');
    expect(byName[0]?.ref.room.room_id).toBe('A-F6-THU-VIEN');
  });

  it('builds step-by-step route for upper-floor rooms', () => {
    const ref = getRoomRef('A201');
    expect(ref).toBeDefined();
    const route = buildRouteToRoom(ref!.building, ref!.floor, ref!.room);
    expect(route).not.toBeNull();
    expect(route!.segments.map((s) => s.level)).toEqual([1, 2]);
    expect(route!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('supports both iso 2.5D and top 2D projections with aligned orientation', () => {
    const isoA = project([10, 20], 0, { phi: 71, cx: 0, cy: 0, mode: 'iso' });
    const isoB = project([10, 20], 10, { phi: 71, cx: 0, cy: 0, mode: 'iso' });
    expect(isoB[1]).toBeLessThan(isoA[1]);

    const topA = project([10, 20], 0, { phi: 71, cx: 0, cy: 0, mode: 'top' });
    const topB = project([10, 20], 10, { phi: 71, cx: 0, cy: 0, mode: 'top' });
    expect(topA).toEqual(topB);
  });
});

describe('MapPage UI', () => {
  it('renders Tòa A, Tòa B, Tòa D, Nhà để xe and switches between 2.5D and 2D flat view', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <Routes>
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/Số 4 ngõ Chùa Hưng Ký/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nhà để xe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tòa B').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tòa D/i).length).toBeGreaterThan(0);

    // Bấm vào Tòa B để xem thông báo chờ bổ sung phòng
    fireEvent.click(screen.getByRole('button', { name: /Tòa B\s*3 tầng/i }));
    expect(screen.getByText(/Sẽ bổ sung chi tiết phòng sau/i)).toBeInTheDocument();

    // Đóng panel Tòa B rồi mở Tòa A (6 tầng)
    fireEvent.click(screen.getByRole('button', { name: 'Đóng thông tin tòa nhà' }));
    fireEvent.click(screen.getByRole('button', { name: /Tòa A\s*6 tầng/i }));
    expect(screen.getByRole('navigation', { name: 'Chọn tầng' })).toBeInTheDocument();

    // Chuyển sang chế độ 2D Phẳng
    const toggleBtn = screen.getByTitle('Đổi chế độ 2.5D / 2D phẳng');
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('2D');
  });

  it('auto-opens a room passed via ?room= query param', () => {
    render(
      <MemoryRouter initialEntries={['/map?room=A201']}>
        <Routes>
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /A201/i })).toBeInTheDocument();
    expect(screen.getByText(/Lộ trình nội bộ/i)).toBeInTheDocument();
  });
});
