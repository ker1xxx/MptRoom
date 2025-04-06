using Avalonia.Controls;
using Microsoft.Extensions.DependencyInjection;
using TestTask.ViewModels;

namespace TestTask.Views
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            DataContext = App.Services.GetRequiredService<MainWindowViewModel>();
        }
    }
}