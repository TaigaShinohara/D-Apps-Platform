"""Reject paths/links escaping the archive, and writes through symlink parents."""
import posixpath
import stat
import sys
import zipfile


def audit(path):
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        if len(entries) > 10000 or sum(i.file_size for i in entries) > 100 * 1024**2:
            raise ValueError("Archive exceeds verification budget")
        links, names, folded_names = {}, set(), set()
        for entry in entries:
            name = entry.filename.rstrip("/")
            parts = name.split("/")
            if name.casefold() in folded_names or not name or name.startswith("/") or "\\" in name or any(p in ("", ".", "..") for p in parts) or parts[0] not in ("OneClip.app", "__MACOSX"):
                raise ValueError("Unsafe archive path")
            names.add(name)
            folded_names.add(name.casefold())
            if stat.S_ISLNK(entry.external_attr >> 16):
                target = archive.read(entry).decode("utf8")
                if target.startswith("/") or "\\" in target or "\x00" in target:
                    raise ValueError("Unsafe symbolic link")
                links[name] = posixpath.normpath(posixpath.join(posixpath.dirname(name), target))
        folded_links = {name.casefold() for name in links}
        for name in names:
            components = name.split("/")
            if any("/".join(components[:n]).casefold() in folded_links for n in range(1, len(components))):
                raise ValueError("Archive writes through a symbolic link")
        for target in links.values():
            for _ in range(40):
                if not target.startswith("OneClip.app/"):
                    raise ValueError("Symbolic link escapes bundle")
                parts = target.split("/")
                prefix = next(("/".join(parts[:n]) for n in range(1, len(parts) + 1) if "/".join(parts[:n]) in links), None)
                if prefix is None:
                    if target not in names:
                        raise ValueError("Dangling symbolic link")
                    break
                target = posixpath.normpath(links[prefix] + target[len(prefix):])
            else:
                raise ValueError("Symbolic link loop")


if __name__ == "__main__":
    audit(sys.argv[1])
