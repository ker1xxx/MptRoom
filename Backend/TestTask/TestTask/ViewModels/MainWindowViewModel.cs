using System.Collections.ObjectModel;
using System.Linq;
using System.Reactive;
using System;
using ReactiveUI;
using TestTask.Models;
using TestTask.Services;

namespace TestTask.ViewModels
{

    public partial class MainWindowViewModel : ReactiveObject
    {
        private readonly IHistoryLoader _historyLoader;
        private ObservableCollection<HistoryPosition> _allItems;
        private int _currentPage = 1;
        private const int _pageSize = 10;

        private ObservableCollection<HistoryPosition> _pagedItems = new();
        public ObservableCollection<HistoryPosition> PagedItems
        {
            get => _pagedItems;
            set => this.RaiseAndSetIfChanged(ref _pagedItems, value);
        }

        private ObservableCollection<int> _pageNumbers = new();
        public ObservableCollection<int> PageNumbers
        {
            get => _pageNumbers;
            set => this.RaiseAndSetIfChanged(ref _pageNumbers, value);
        }

        public ReactiveCommand<Unit, Unit> GenerateTradeHistoryCommand { get; }
        public ReactiveCommand<int, Unit> GoToPageCommand { get; }
        public ReactiveCommand<Unit, Unit> GoToFirstPageCommand { get; }
        public ReactiveCommand<Unit, Unit> GoToPreviousPageCommand { get; }
        public ReactiveCommand<Unit, Unit> GoToNextPageCommand { get; }
        public ReactiveCommand<Unit, Unit> GoToLastPageCommand { get; }

        public bool CanGoPrevious => _currentPage > 1;
        public bool CanGoNext => _currentPage < TotalPages;
        public int TotalPages => (_allItems.Count + _pageSize - 1) / _pageSize;

        public MainWindowViewModel(IHistoryLoader historyLoader)
        {
            _historyLoader = historyLoader;

            GenerateTradeHistoryCommand = ReactiveCommand.Create(GenerateTradeHistory);
            GoToPageCommand = ReactiveCommand.Create<int>(GoToPage);
            GoToFirstPageCommand = ReactiveCommand.Create(() => GoToPage(1));
            GoToPreviousPageCommand = ReactiveCommand.Create(() => GoToPage(_currentPage - 1), this.WhenAnyValue(vm => vm.CanGoPrevious));
            GoToNextPageCommand = ReactiveCommand.Create(() => GoToPage(_currentPage + 1), this.WhenAnyValue(vm => vm.CanGoNext));
            GoToLastPageCommand = ReactiveCommand.Create(() => GoToPage(TotalPages));

            LoadData();
        }

        private void LoadData()
        {
            _allItems = new ObservableCollection<HistoryPosition>(_historyLoader.GenerateTradeHistroy());
            GenerateTradeHistory();
        }

        private void GenerateTradeHistory()
        {
            _allItems = new ObservableCollection<HistoryPosition>(_historyLoader.GenerateTradeHistroy());
            GoToPage(1);
        }

        private void GoToPage(int pageNumber)
        {
            if (pageNumber < 1 || pageNumber > TotalPages) return;
            _currentPage = pageNumber;
            PagedItems = new ObservableCollection<HistoryPosition>(_allItems
                .Skip((_currentPage - 1) * _pageSize)
                .Take(_pageSize));
            UpdatePageNumbers();
        }

        private void UpdatePageNumbers()
        {
            int startPage = Math.Max(1, _currentPage - 2);
            int endPage = Math.Min(TotalPages, startPage + 4);

            PageNumbers.Clear();
            foreach (var page in Enumerable.Range(startPage, endPage - startPage + 1))
            {
                PageNumbers.Add(page);
            }
        }
    }
}