CREATE TABLE hits (
    id integer primary key autoincrement not null,
    session integer references sessions(id),
    x real,
    y real,
    angle real,
    dist real,
    score int
);

CREATE TABLE sessions (
    id integer primary key autoincrement not null,
    starttime integer default ( datetime() ),
    open boolean default false
);
