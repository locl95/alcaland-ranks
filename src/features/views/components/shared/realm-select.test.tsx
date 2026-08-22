import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RealmSelect } from './realm-select.tsx';

const realmOptions = () => within(screen.getByRole('listbox')).getAllByRole('option');
const realmOption = (name: string) =>
  within(screen.getByRole('listbox')).queryByRole('option', { name });

const renderSelect = (props: Partial<React.ComponentProps<typeof RealmSelect>> = {}) =>
  render(
    <RealmSelect
      region="eu"
      realm=""
      onRegionChange={vi.fn()}
      onRealmChange={vi.fn()}
      {...props}
    />,
  );

describe('RealmSelect', () => {
  describe('region', () => {
    it('calls onRegionChange with the new region value', async () => {
      const onRegionChange = vi.fn();
      renderSelect({ onRegionChange });
      await userEvent.selectOptions(screen.getByLabelText('Region'), 'us');
      expect(onRegionChange).toHaveBeenCalledWith('us');
    });

    it('clears the realm when the region changes', async () => {
      const onRealmChange = vi.fn();
      renderSelect({ realm: 'tarren-mill', onRealmChange });
      await userEvent.selectOptions(screen.getByLabelText('Region'), 'us');
      expect(onRealmChange).toHaveBeenCalledWith('');
    });

    it('offers NA realms when the region is us', async () => {
      renderSelect({ region: 'us' });
      await userEvent.click(screen.getByLabelText('Realm'));
      expect(realmOption('Alleria')).toBeInTheDocument();
      expect(realmOption('Sanguino')).not.toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('narrows the list to realms matching what was typed', async () => {
      renderSelect();
      await userEvent.type(screen.getByLabelText('Realm'), 'sa');

      expect(realmOption('Sanguino')).toBeInTheDocument();
      expect(realmOption('Tarren Mill')).not.toBeInTheDocument();
    });

    it('ranks prefix matches above matches later in the name', async () => {
      renderSelect();
      await userEvent.type(screen.getByLabelText('Realm'), 'sa');

      const names = realmOptions().map((o) => o.textContent);
      expect(names.slice(0, 3)).toEqual(['Sanguino', 'Sargeras', 'Saurfang']);
      expect(names.indexOf('Sindragosa')).toBeGreaterThan(2);
    });

    it('matches text anywhere in the name', async () => {
      renderSelect();
      await userEvent.type(screen.getByLabelText('Realm'), 'mill');
      expect(realmOption('Tarren Mill')).toBeInTheDocument();
    });

    it('ignores case', async () => {
      renderSelect();
      await userEvent.type(screen.getByLabelText('Realm'), 'SANG');
      expect(realmOption('Sanguino')).toBeInTheDocument();
    });

    it('reports when nothing matches', async () => {
      renderSelect();
      await userEvent.type(screen.getByLabelText('Realm'), 'zzzzz');
      expect(screen.getByText('No realms found')).toBeInTheDocument();
      expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0);
    });
  });

  describe('selection', () => {
    it('calls onRealmChange with the slug when an option is clicked', async () => {
      const onRealmChange = vi.fn();
      renderSelect({ onRealmChange });

      await userEvent.type(screen.getByLabelText('Realm'), 'sangu');
      await userEvent.click(realmOption('Sanguino')!);

      expect(onRealmChange).toHaveBeenCalledWith('sanguino');
    });

    it('shows the selected realm label once closed', async () => {
      renderSelect({ realm: 'sanguino' });
      expect(screen.getByLabelText('Realm')).toHaveValue('Sanguino');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not select anything on Enter — the list is mouse driven', async () => {
      const onRealmChange = vi.fn();
      renderSelect({ onRealmChange });

      await userEvent.type(screen.getByLabelText('Realm'), 'sangu');
      await userEvent.keyboard('{Enter}');

      expect(onRealmChange).not.toHaveBeenCalled();
    });

    it('does not submit the surrounding form on Enter', async () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <RealmSelect region="eu" realm="" onRegionChange={vi.fn()} onRealmChange={vi.fn()} />
          <button type="submit">Create</button>
        </form>,
      );

      await userEvent.type(screen.getByLabelText('Realm'), 'sangu');
      await userEvent.keyboard('{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('closes when clicking outside without selecting', async () => {
      const onRealmChange = vi.fn();
      render(
        <div>
          <button>outside</button>
          <RealmSelect
            region="eu"
            realm=""
            onRegionChange={vi.fn()}
            onRealmChange={onRealmChange}
          />
        </div>,
      );

      await userEvent.type(screen.getByLabelText('Realm'), 'sa');
      await userEvent.click(screen.getByRole('button', { name: 'outside' }));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onRealmChange).not.toHaveBeenCalled();
    });
  });
});
