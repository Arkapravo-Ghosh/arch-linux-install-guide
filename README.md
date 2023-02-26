# Arch Linux Installation Guide
This guide covers everything you need to install a full fledged Arch Linux System with KDE Plasma Desktop Environment.

# Initial Configuration

## Network Config for liveiso

* `systemctl start iwd dhcpcd` - Starts IW Daemon and DHCP Client Daemon
* `iwconfig` - Use this to Check Wi-Fi Interface Name (wlan0/wlo1/wlp2s0)
* `iwctl station <interface> scan` - Scan SSIDs
* `iwctl station <interface> get-networks` - Check SSID for your preferable network
* `iwctl station <interface> connect "<ssid>"` - Enter password after hitting enter
* `ping 1.1.1.1` - Check if DHCP is working
* `ping archlinux.org` - Check if DNS is working

## Timezone Config for liveiso
* `timedatectl set-timezone <Region/City>` - Put your timezone here (Asia/Kolkata)
* `timedatectl set-ntp true` - Enable Network Time Sync
* `timedatectl set-local-rtc true` - Sync local time with hardware clock

## Partitioning Filesystem

* `fdisk -l` - List Devices and Partitions
* `cfdisk /dev/<device>` - Make 3 partitions:
1. 512M EFI System Partition (`<efi>`)
2. 8.8G Linux Swap Partition (`<swap>`)
3. Remaining Size (Preferably 140.3G) Linux Filesystem (`<root>`)
* `fdisk -l` - Check the partition numbers properly.
* `mkfs.fat -F 32 /dev/<efi>` - Format the EFI Filesystem in Fat32
* `mkswap /dev/<swap>` - Format the Swap Filesystem

## Mounting Filesystem

### Mount Root

<details>
    <summary>BTRFS as root (Skip to next section for EXT4 guide)</summary>

* `mkfs.btrfs -f /dev/<root>` - Format the Root Filesystem in B-Tree Filesystem
* `mount /dev/<root> /mnt` - Mount the Root to /mnt

## Create BTRFS Subvolumes

* `btrfs su cr /mnt/@`
* `btrfs su cr /mnt/@home`
* `btrfs su cr /mnt/@var`
* `btrfs su cr /mnt/@opt`
* `btrfs su cr /mnt/@tmp`
* `btrfs su cr /mnt/@.snapshots`

## Unmount Root

* `umount /mnt`

## Mount "@" subvoume to /mnt

* `mount -o noatime,commit=120,compress=zstd,space_cache=v2,subvol=@ /dev/<root> /mnt`

## Create necessary mountpoints

* `mkdir /mnt/{boot,home,var,opt,tmp,.snapshots}`

## Mount other subvolumes with proper options

* `mount -o noatime,commit=120,compress=zstd,space_cache=v2,subvol=@home /dev/<root> /mnt/home`
* `mount -o noatime,commit=120,compress=zstd,space_cache=v2,subvol=@opt /dev/<root> /mnt/opt`
* `mount -o noatime,commit=120,compress=zstd,space_cache=v2,subvol=@tmp /dev/<root> /mnt/tmp`
* `mount -o noatime,commit=120,compress=zstd,space_cache=v2,subvol=@.snapshots /dev/<root> /mnt/.snapshots`
* `mount -o subvol=@var /dev/<root> /mnt/var`
</details>

<details>
    <summary>OR, EXT4 as root</summary>

* `mkfs.ext4 /dev/<root>` - Format the Root Filesystem in Ext4 Filesystem
* `mount /dev/<root> /mnt` - Mount the Root to /mnt
</details>

## Mount Boot and Swap

* `mkdir /mnt/boot/efi` - Make the EFI mount point folder
* `mount /dev/<efi> /mnt/boot/efi` - Mount the EFI Partition
* `swapon /dev/<swap>` - Using the Swap Partition

# Installing the Base Linux System

* `nano /etc/pacman.conf` - Uncomment the following:

`Color`\
`ParallelDownloads = 5`

`[multilib]`\
`Include = /etc/pacman.d/mirrorlist`

then save and exit

* `pacstrap /mnt base linux linux-firmware vim nano btrfs-progs` - Select the default.
> **NOTE:** If you want **Linux Zen** Kernel, replace "`linux`" with "`linux-zen`".\
**Don't** replace "`linux-firmware`".\
Also, if you are using **Ext4**, then "`btrfs-progs`" is **not** needed.
* `genfstab -U /mnt >> /mnt/etc/fstab` - Generating fstab configuration

# Chrooting

* `arch-chroot /mnt`

## Network Configuration

* `nano /etc/hostname` - Write your hostname here and remember it (`<hostname>`), save and exit
* `nano /etc/hosts` - Write the following in it:
```
127.0.0.1   localhost
::1         localhost
127.0.1.1   <hostname>
```

## Locale Configuration

* `nano /etc/locale.gen` - Uncomment your locale here (en_US.UTF-8)
* `locale-gen` - Generates your locales based on "`/etc/locale.gen`"
* `nano /etc/locale.conf` - Type here "`LANG=en_US.UTF-8`" (or whatever locale you chose)
* `export LANG=en_US.UTF-8` - If you chose another locale, type accordingly

## Installing necessary packages

* `nano /etc/pacman.conf` - Uncomment the following:

`Color`\
`ParallelDownloads = 5`

`[multilib]`\
`Include = /etc/pacman.d/mirrorlist`

then save and exit

* `pacman -Syy sudo linux-headers efibootmgr grub intel-ucode git base-devel grub-btrfs dkms avahi os-prober`
> **NOTE:** If you have an **AMD Processor** instead, replace "`intel-ucode`" with "`amd-ucode`"\
If you have installed "`linux-zen`" in the previous pacstrap command, then replace "`linux-headers`" with "`linux-zen-headers`"\
Also, if you have Ext4 then "`grub-btrfs`" is not required.

## Adding a sudo user

* `passwd` - Enter new password for root
* `useradd -m <username>` - Enter your new username (`<username>`)
* `usermod -aG wheel <username>` - Add user to wheel group for sudo permissions
* `passwd <username>` - Enter new password for your new user
* `EDITOR=nano visudo` - At the bottom of the file, uncomment the line "`%wheel ALL=(ALL:ALL) ALL`", save and exit

## Installing a Bootloader (GRUB)

* `grub-install --target=x86_64-efi --bootloader-id=archlinux --efi-directory=/boot/efi --recheck` - Installing GRUB
> **NOTE:** If your UEFI Entry disappears on reboot due to the requirement of known location to bootable file before showing up UEFI NVRAM Boot 
entries, just use "`--removable`" flag after the whole command.

* `nano /etc/default/grub` - Uncomment the line at the end of file saying "`GRUB_DISABLE_OS_PROBER=false`"
* `mkinitcpio -P` - Generating Initramfs
* `grub-mkconfig -o /boot/grub/grub.cfg` - Generating GRUB Configuration file

## Installing a Desktop Environment (KDE Plasma)

* `pacman -S plasma plasma-wayland-session kde-applications sddm noto-fonts-emoji packagekit-qt5 gnome-keyring` - Read carefully and select the options\
Go for `pipewire`, `pipewire-media-session`, `vlc`, `pyqt5`, `cronie` or `all` in the options, then wait till installation
* `systemctl enable NetworkManager sddm avahi-daemon` - Enabling KDE's NetworkManager, Display Manager and Avahi Daemon
* `exit` - Exiting Chroot
* `reboot now` - Rebooting to Installed Arch Linux. Do not forget to change DE to **Plasma (X11)**.

# Post Install Configuration

## Fix Audio when using PipeWire

* `sudo systemctl --global mask wireplumber`
* `reboot`
> **NOTE:** In case of any issues, just run "`sudo systemctl --global unmask wireplumber`" and `reboot`. to undo changes.

## Installing an AUR Helper (YAY)

* `cd /opt`
* `sudo git clone https://aur.archlinux.org/yay-git.git`
* `sudo chown -R <username>:<username> ./yay-git`
* `cd yay-git`
* `makepkg -si`

<details>
    <summary>Optional: Performance Tweak for YAY</summary>

* `sudo pacman -S ccache`
* `sudo nano /etc/makepkg.conf`

Find **BUILDENV** and remove the exclamation (`!`) mark from "`ccache`" like this:

`BUILDENV=(fakeroot !distcc color ccache check !sign)`

Find MAKEFLAGS, uncomment it and edit the numerical value to the number of CPU threads you have. For example, for 16 threads, do this:

`MAKEFLAGS="-j16"`

Save and Exit

* `sudo nano /etc/bash.bashrc` - If you use zsh, then replace the path with "`/etc/zsh/zshrc`"

Put this in the last line of the file:

`export PATH="/usr/lib/ccache/bin/:$PATH"`

Save and Exit
Close the terminal and reopen to apply changes.
</details>

## Installing FlatPak

* `sudo pacman -S flatpak`
* `sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo` - Adding FlatHub repo
* `sudo flatpak override --filesystem=xdg-config/gtk-3.0` - Forcing FlatPak to use System GTK Themes
* `reboot` - Reboot to complete installation
<details>
    <summary>Alternate: Installing Snapd</summary>

* `yay -S snapd`
* `sudo systemctl enable snapd snapd.socket snapd.seeded snapd.apparmor`
* `sudo ln -s /var/lib/snapd/snap /snap`
* `reboot` - Reboot to complete installation
</details>

## Installing Plymouth

* `yay -S plymouth-git`

### Configure Initramfs

* `sudo nano /etc/mkinitcpio.conf`

Edit **HOOKS** to have "`plymouth`" after "`base`" and "`udev`" and **MODULES** to have "`i915`" (for **Intel GPU** only) at beginning like this:

`MODULES=(i915 ...)`\
`HOOKS=(base udev plymouth ...)`

> **NOTE:** If you have **AMD GPU**, replace "`i915`" with "`amdgpu`" and for **NVIDIA GPU**, replace it with "`nvidia nvidia_modeset nvidia_uvm nvidia_drm`"

> **NOTE:** For **Laptops** having a **dGPU** and an **iGPU**, consider using **iGPU** in this part, i.e., usually Intel GPU or AMD GPU.

Save and Exit

### Regenerate Initramfs

* `sudo mkinitcpio -P`

### Configure GRUB

* `sudo nano /etc/default/grub`

Edit `GRUB_CMDLINE_LINUX_DEFAULT` to have "`splash`" after "`quiet`" like this:

`GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"`

Save and Exit

### Regenerate GRUB Configuration

* `yay -S update-grub`
* `sudo update-grub`

### Enable SDDM Plymouth

* `sudo systemctl disable sddm`
* `sudo systemctl enable sddm-plymouth`

### Install a Plymouth Theme

* `yay -S plymouth-theme-arch-breeze-git`
* `sudo plymouth-set-default-theme -R arch-breeze`
* `reboot` - Reboot to complete installation

## Install a better GRUB Theme (Xenlism GRUB Theme)

* `git clone https://github.com/xenlism/Grub-themes.git`
* `cd ./Grub-themes/xenlism-grub-arch-1080p/`
> **NOTE:** If your monitor has a higher resolution than 1080p, then select the theme directory accordingly.
* `sudo ./install.sh`
* `reboot now` - Reboot to complete installation

## Install Missing Kernel Headers

* `yay -S mkinitcpio-firmware`

## Install better shell (Oh-My-Zsh)

### Install Zsh

* `sudo pacman -S zsh zshdb zsh-syntax-highlighting zsh-autosuggestions zsh-history-substring-search`
* `touch ~/.zshrc` - Create Initial Empty Zsh Config
* `chsh -s /bin/zsh` - Change Default Shell to Zsh
zsh
* `sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` - Install Oh-My-Zsh on top of zsh
* `nano .zshrc`

Edit the value of `ZSH_THEME` to "`xiong-chiamiov`" like this:

`ZSH_THEME="xiong-chiamiov"`

Edit the last line of the file to have the following:

`source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh`\
`source /usr/share/zsh/plugins/zsh-history-substring-search/zsh-history-substring-search.zsh`\
`source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh`

Save and Exit

* `reboot` - Reboot to complete installation

## Install Google Chrome and Microsoft Edge Web Browser

* `yay -S google-chrome microsoft-edge-stable-bin`

<details>
    <summary>Optional: Enable Dark Mode in Google Chrome</summary>
Edit the application launcher to have the following as the command:

`/usr/bin/google-chrome-stable --enable-features=WebUIDarkMode --force-dark-mode %U`
</details>

## Configure Automatic System Backup

* `yay -S timeshift timeshift-autosnap`

Open Timeshift from your app launcher and set **BTRFS Backup** to *Boot*, *Daily* and *Hourly*. Also select `@home` subvolume for backup. That's it.

## Install BlackArch Repository
* `curl -O https://blackarch.org/strap.sh`
* `chmod +x strap.sh`
* `sudo ./strap.sh`
* `sudo pacman -Syyu`

## Allow udisks to mount disks without asking sudo password

* `sudo nano /etc/polkit-1/rules.d/.rules`

Add the following in this file:

```
polkit.addRule(function(action, subject) {
        if (((action.id == "org.freedesktop.udisks2.filesystem-fstab") ||
            (action.id == "org.freedesktop.udisks2.filesystem-fstab")) &&
            subject.local && subject.active) {
            return polkit.Result.YES;
        }
});

polkit.addRule(function(action, subject) {
        if (((action.id == "org.freedesktop.udisks2.filesystem-mount-system") ||
            (action.id == "org.freedesktop.udisks2.filesystem-mount-system")) &&
            subject.local && subject.active) {
            return polkit.Result.YES;
        }
});
```
Save and Exit

* `reboot` - Reboot to apply changes
