import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let dialog: MatDialog;

  const data: ConfirmDialogData = {
    title: 'Delete task?',
    message: '"Prepare Q4 budget report" will be removed for everyone.',
    confirmLabel: 'Delete',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    dialog = TestBed.inject(MatDialog);
  });

  afterEach(() => {
    dialog.closeAll();
    TestBed.tick();
  });

  function container(): HTMLElement {
    return document.querySelector('mat-dialog-container') as HTMLElement;
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(container().querySelectorAll('button'));
  }

  it('shows the title, message and confirm label', () => {
    dialog.open(ConfirmDialog, { data });
    TestBed.tick();

    expect(container().textContent).toContain('Delete task?');
    expect(container().textContent).toContain('will be removed for everyone');
    expect(buttons().map((button) => button.textContent?.trim())).toEqual(['Cancel', 'Delete']);
  });

  it('resolves true when confirmed', async () => {
    const ref = dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data });
    TestBed.tick();

    const closed = new Promise((resolve) => ref.afterClosed().subscribe(resolve));
    buttons()[1].click();
    TestBed.tick();

    await expectAsync(closed).toBeResolvedTo(true);
  });

  it('resolves false when cancelled', async () => {
    const ref = dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data });
    TestBed.tick();

    const closed = new Promise((resolve) => ref.afterClosed().subscribe(resolve));
    buttons()[0].click();
    TestBed.tick();

    await expectAsync(closed).toBeResolvedTo(false);
  });
});
