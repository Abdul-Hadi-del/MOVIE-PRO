import backend   # 👈 Ye line connection banati hai

def menu():
    while True:
        print("\n--- MovieSort Pro ---")
        print("1. Add Movie")
        print("2. View Movies")
        print("3. Sort Movies")
        print("4. Search Movie")
        print("5. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            title = input("Enter title: ")
            year = input("Enter year: ")
            rating = input("Enter rating: ")
            genre = input("Enter genre: ")
            backend.add_movie(title, year, rating, genre)   # 👈 Backend function call
            print("✅ Movie added successfully!")
        elif choice == "2":
            movies = backend.view_movies()   # 👈 Backend function call
            for m in movies:
                print(f"{m['title']} ({m['year']}) - {m['rating']} [{m['genre']}]")

        elif choice == "3":
            key = input("Sort by (title/year/rating/genre): ")
            backend.bubble_sort(key)   # 👈 Backend function call
            print("✅ Movies sorted successfully!")

        elif choice == "4":
            title = input("Enter movie title to search: ")
            result = backend.linear_search(title)   # 👈 Backend function call
            if result:
                print(f"Found: {result['title']} ({result['year']}) - {result['rating']} [{result['genre']}]")
            else:
                print("Movie not found.")

        elif choice == "5":
            break

menu()