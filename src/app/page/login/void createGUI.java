void createGUI() {
    // Set layout for the frame
    favoriteMovieWindow.setLayout(new BorderLayout());

    // --- Top panel (Label, TextField, Buttons) ---
    JPanel topPanel = new JPanel();
    topPanel.setLayout(new FlowLayout());

    JLabel movieLabel = new JLabel("Movie:");
    JTextField movieTextField = new JTextField(15);

    JButton addButton = new JButton("Add");
    JButton displayButton = new JButton("Display");

    // add action listener (handled in actionPerformed)
    addButton.addActionListener(this);
    displayButton.addActionListener(this);

    // Add components to top panel
    topPanel.add(movieLabel);
    topPanel.add(movieTextField);
    topPanel.add(addButton);
    topPanel.add(displayButton);

    // --- Movie list area (Center panel) ---
    movieList = new JList<>();
    JScrollPane scrollPane = new JScrollPane(movieList);

    // Add panels to frame
    favoriteMovieWindow.add(topPanel, BorderLayout.NORTH);
    favoriteMovieWindow.add(scrollPane, BorderLayout.CENTER);

    // Set frame size and visibility
    favoriteMovieWindow.setSize(500, 300);
    favoriteMovieWindow.setVisible(true);
}
