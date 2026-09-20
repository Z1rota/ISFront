import { MatPaginatorIntl } from '@angular/material/paginator';

export function russianPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Записей на странице:';
  intl.nextPageLabel = 'Следующая страница';
  intl.previousPageLabel = 'Предыдущая страница';
  intl.firstPageLabel = 'Первая страница';
  intl.lastPageLabel = 'Последняя страница';
  intl.getRangeLabel = (page, pageSize, length) => {
    length = Math.max(length, 0);
    if (length === 0 || pageSize === 0) {
      return `0 из ${length}`;
    }
    const start = page * pageSize;
    return `${start + 1}–${Math.min(start + pageSize, length)} из ${length}`;
  };
  return intl;
}
